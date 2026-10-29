import express from "express";
import { NotFoundError } from "../../lib/errors.js";
import { parseId } from "../../lib/params.js";
import { currentTenantId, requireRole } from "../../middleware/auth.js";
import { listStaffQuery, staffSchema } from "./staff.schemas.js";
import * as staff from "./staff.repository.js";

const router = express.Router();

// every route in this file is for logged-in owners only
router.use(requireRole("owner"));

router.get("/", async (req, res) => {
  const { includeInactive } = listStaffQuery.parse(req.query);
  res.json({
    staff: await staff.listStaff(currentTenantId(req), includeInactive),
  });
});

router.post("/", async (req, res) => {
  const input = staffSchema.parse(req.body);
  const member = await staff.createStaff(currentTenantId(req), input);
  res.status(201).json({ staff: member });
});

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id, "staff member");
  const input = staffSchema.parse(req.body);
  const member = await staff.updateStaff(currentTenantId(req), id, input);
  if (!member) throw new NotFoundError("staff member not found");
  res.json({ staff: member });
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id, "staff member");
  const found = await staff.deactivateStaff(currentTenantId(req), id);
  if (!found) throw new NotFoundError("staff member not found");
  res.status(204).end();
});

export default router;
