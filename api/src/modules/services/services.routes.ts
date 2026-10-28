import express from "express";
import { NotFoundError } from "../../lib/errors.js";
import { parseId } from "../../lib/params.js";
import { currentTenantId, requireRole } from "../../middleware/auth.js";
import {
  createServiceSchema,
  listServicesQuery,
  updateServiceSchema,
} from "./services.schemas.js";
import * as services from "./services.repository.js";

const router = express.Router();

// every route in this file is for logged-in owners only
router.use(requireRole("owner"));

router.get("/", async (req, res) => {
  const { includeInactive } = listServicesQuery.parse(req.query);
  res.json({
    services: await services.listServices(
      currentTenantId(req),
      includeInactive,
    ),
  });
});

router.post("/", async (req, res) => {
  const input = createServiceSchema.parse(req.body);
  const service = await services.createService(currentTenantId(req), input);
  res.status(201).json({ service });
});

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id, "service");
  const patch = updateServiceSchema.parse(req.body);
  const service = await services.updateService(currentTenantId(req), id, patch);
  if (!service) throw new NotFoundError("service not found");
  res.json({ service });
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id, "service");
  const found = await services.deactivateService(currentTenantId(req), id);
  if (!found) throw new NotFoundError("service not found");
  res.status(204).end();
});

export default router;
