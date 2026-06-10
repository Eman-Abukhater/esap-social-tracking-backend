import { Router } from "express";
import {
  assignContentItem,
  createContentItem,
  deleteContentItem,
  getContentItems,
  updateContentItem,
  updateContentStatus,
} from "../controllers/content-controller";
import { loadActingUser, requireRole } from "../middlewares/rbac";
import { validate } from "../middlewares/validate";
import {
  AssignContentBodySchema,
  CreateContentBodySchema,
  DeleteContentBodySchema,
  GetContentQuerySchema,
  UpdateContentBodySchema,
  UpdateStatusBodySchema,
} from "../lib/schemas";

const router = Router();

router.get("/", validate(GetContentQuerySchema, "query"), getContentItems);

router.post(
  "/",
  validate(CreateContentBodySchema),
  loadActingUser,
  createContentItem
);

router.patch(
  "/:id/status",
  validate(UpdateStatusBodySchema),
  loadActingUser,
  updateContentStatus
);

router.patch(
  "/:id/assign",
  validate(AssignContentBodySchema),
  loadActingUser,
  requireRole("admin", "manager"),
  assignContentItem
);

router.patch(
  "/:id",
  validate(UpdateContentBodySchema),
  loadActingUser,
  updateContentItem
);

router.delete(
  "/:id",
  validate(DeleteContentBodySchema),
  loadActingUser,
  requireRole("admin", "manager"),
  deleteContentItem
);

export default router;
