import express from "express";
import { parseId } from "../../lib/params.js";
import { currentTenantId, requireRole } from "../../middleware/auth.js";
import { putHoursSchema } from "./working-hours.schemas.js";
import * as workingHours from "./working-hours.service.js";

const router = express.Router({ mergeParams: true });
type Params = { staffId: string };

router.use(requireRole("owner"));

router.get<"/", Params>("/", async (req, res) => {
  const staffId = parseId(req.params.staffId, "staff member");
  res.json({
    hours: await workingHours.getHours(currentTenantId(req), staffId),
  });
});

router.put<"/", Params>("/", async (req, res) => {
  const staffId = parseId(req.params.staffId, "staff member");
  const { hours } = putHoursSchema.parse(req.body);
  res.json({
    hours: await workingHours.replaceHours(
      currentTenantId(req),
      staffId,
      hours,
    ),
  });
});

export default router;
