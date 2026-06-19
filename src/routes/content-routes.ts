import { Router } from "express";
import {
  assignContentItem,
  createContentItem,
  deleteContentItem,
  getContentItems,
  updateContentItem,
  updateContentStatus,
} from "../controllers/content-controller";
import { requireRole } from "../middlewares/rbac";
import { validate } from "../middlewares/validate";
import {
  AssignContentBodySchema,
  CreateContentBodySchema,
  GetContentQuerySchema,
  UpdateContentBodySchema,
  UpdateStatusBodySchema,
} from "../lib/schemas";

const router = Router();

router.get("/", validate(GetContentQuerySchema, "query"), getContentItems);

router.post(
  "/",
  validate(CreateContentBodySchema),
  createContentItem
);

router.patch(
  "/:id/status",
  validate(UpdateStatusBodySchema),
  updateContentStatus
);

router.patch(
  "/:id/assign",
  validate(AssignContentBodySchema),
  requireRole("admin", "manager"),
  assignContentItem
);

router.patch(
  "/:id",
  validate(UpdateContentBodySchema),
  updateContentItem
);

router.delete(
  "/:id",
  requireRole("admin", "manager"),
  deleteContentItem
);

export default router;
