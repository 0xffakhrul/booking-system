# Infrastructure

Terraform for the production server: one Tencent Cloud Lighthouse instance in
Singapore, its SSH key, and its firewall. State is kept in a private,
versioned COS bucket.

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

3. Export an API key for a sub-user with Lighthouse and COS access:

   ```sh
   export TENCENTCLOUD_SECRET_ID=...
   export TENCENTCLOUD_SECRET_KEY=...
   ```

4. Initialise and plan:

   ```sh
   terraform init -backend-config=backend.hcl
   terraform plan
   ```

## Day to day

```sh
terraform plan    # read the plan; nothing should be destroyed
terraform apply
```

If your home IP changes, SSH stops working. Update `admin_cidr` in
`terraform.tfvars` and apply again. That goes through the Tencent API, not
SSH, so it still works when you're locked out.

## Safety

- The instance has `prevent_destroy`. Terraform refuses any plan that would
  delete it.
- `blueprint_id` (the OS image) is ignored after import. Changing it would
  reinstall the OS and wipe the disk.
- The firewall resource owns the whole rule list. Rules added in the console
  are removed on the next apply.
