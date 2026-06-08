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

const router = Router();

router.get("/", getContentItems);
router.post("/", loadActingUser, createContentItem);
router.patch("/:id/status", loadActingUser, updateContentStatus);
router.patch(
  "/:id/assign",
  loadActingUser,
  requireRole("admin", "manager"),
  assignContentItem
);
router.patch("/:id", loadActingUser, updateContentItem);
router.delete(
  "/:id",
  loadActingUser,
  requireRole("admin", "manager"),
  deleteContentItem
);

export default router;