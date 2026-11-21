# Deploying

Production runs on one Tencent Cloud Lighthouse server (`infra/terraform`) from
`/opt/booking`, as a Compose stack:

| Service    | What it does                                                                  |
| ---------- | ----------------------------------------------------------------------------- |
| `caddy`    | HTTPS on 80/443 for `booking.0xffakhrul.xyz`, certificates from Let's Encrypt |
| `app`      | The API and the React app, from the image CI built and scanned                |
| `postgres` | The database, not reachable from outside                                      |
| `migrate`  | Runs once per deploy, before the new image goes live                          |

New releases go live on their own: a systemd timer runs `deploy.sh` every minute,
which pulls `:main` from GHCR, migrates, swaps the image in, and rolls back if
the health check fails ([ADR-0011](../docs/adr/0011-pull-based-deploys-from-the-server.md)).

## One-time server setup

Done by hand once; Ansible will do the same later.

1. On GitHub, make the image public so the server can pull it without a token:
   **Packages → booking-system → Package settings → Change visibility → Public**.

2. From the repo root on your laptop, copy the files over:

   ```sh
   ssh booking 'sudo mkdir -p /opt/booking && sudo chown ubuntu:ubuntu /opt/booking'
   scp deploy/compose.yml deploy/Caddyfile deploy/deploy.sh \
       deploy/booking-deploy.service deploy/booking-deploy.timer booking:/opt/booking/
   ```

3. On the server (`ssh booking`), install updates and Docker:

   ```sh
   sudo apt-get update && sudo apt-get -y upgrade
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
     | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo usermod -aG docker ubuntu
   ```

   Log out and back in so the `docker` group applies.

4. If `free -h` shows no swap, add 2 GB. With 2 GB of RAM, a spike in Postgres
   or Node would otherwise get a process killed:

   ```sh
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

5. Create `.env` with generated passwords, and save a copy in your password
   manager:

   ```sh
   cd /opt/booking
   umask 077
   cat > .env <<ENV
   APP_HOSTNAME=booking.0xffakhrul.xyz
   POSTGRES_USER=booking_admin
   POSTGRES_PASSWORD=$(openssl rand -hex 24)
   POSTGRES_DB=booking
   APP_DB_PASSWORD=$(openssl rand -hex 24)
   ENV
   ```

6. First deploy by hand, then hand over to the timer:

   ```sh
   ./deploy.sh
   sudo cp booking-deploy.service booking-deploy.timer /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now booking-deploy.timer
   ```

## Day to day

```sh
journalctl -u booking-deploy -f        # deploys as they happen
systemctl list-timers booking-deploy   # when the next check runs
cat /opt/booking/.deployed             # the image digest that's live
docker compose logs -f app             # the app's logs (from /opt/booking)
```

- **A deploy failed and rolled back.** The digest is in `.failed` and won't be
  retried. Push a fix; the next image deploys as normal. To retry the same one,
  `rm .failed`.
- **Roll back by hand:** `docker tag booking-app:previous booking-app:current && docker compose up -d --wait`.
  Then stop the timer until a fix is pushed, or the next check
  redeploys `:main`: `sudo systemctl stop booking-deploy.timer`.
- **Changed a file in `deploy/`:** copy it over again with `scp` (step 2) and
  run `./deploy.sh`, or `docker compose up -d` for a Compose or Caddy change.
