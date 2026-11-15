# Infrastructure

Terraform for the production server: one Tencent Cloud Lighthouse instance in
Singapore, its SSH key and its firewall, plus the DNS record on Cloudflare that
points `booking.0xffakhrul.xyz` at it. State is kept in a private, versioned
COS bucket.

The server was bought by hand in the console (it is prepaid monthly), so it is
adopted with `import` blocks rather than created here.

## First-time setup

1. Create a COS bucket in `ap-singapore`, private, with versioning on. Name it
   `booking-tfstate-<APPID>`.
2. Copy the example files and fill them in:

   ```sh
   cp backend.hcl.example backend.hcl
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Load the credentials into the shell without echoing them or saving them
   to history:

   - a Tencent API key for a CAM sub-user with Lighthouse, COS and Tag access
     (the COS backend locks state with a tag)
   - a Cloudflare API token from the "Edit zone DNS" template, limited to the
     one zone

   ```sh
   read -rs 'TENCENTCLOUD_SECRET_ID?SecretId: ' && export TENCENTCLOUD_SECRET_ID
   read -rs 'TENCENTCLOUD_SECRET_KEY?SecretKey: ' && export TENCENTCLOUD_SECRET_KEY
   read -rs 'CLOUDFLARE_API_TOKEN?Cloudflare token: ' && export CLOUDFLARE_API_TOKEN
   ```

4. Initialise and plan:

   ```sh
   terraform init -backend-config=backend.hcl
   terraform plan
   ```

## Day to day

```sh
terraform plan -out=change.tfplan   # read it; nothing should be destroyed
terraform apply change.tfplan
```

If your home IP changes, SSH stops working. Update `admin_cidr` in
`terraform.tfvars` and apply again. That goes through the Tencent API, not
SSH, so it still works when you're locked out.

## Safety

- The instance has `prevent_destroy`. Terraform refuses any plan that would
  delete it.
- `blueprint_id` (the OS image) is ignored after import. Changing it would
  reinstall the OS and wipe the disk.
- The DNS record follows the server's public IP, so a new IP updates DNS on
  the next apply.
- The firewall resource owns the whole rule list. Rules added in the console
  are removed on the next apply.
