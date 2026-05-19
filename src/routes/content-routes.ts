import { Router } from "express";
import {
  assignContentItem,
  createContentItem,
  deleteContentItem,
  getContentItems,
  updateContentItem,
  updateContentStatus,
} from "../controllers/content-controller";

const router = Router();

router.get("/", getContentItems);
router.post("/", createContentItem);
router.patch("/:id/status", updateContentStatus);
router.patch("/:id/assign", assignContentItem);
router.patch("/:id", updateContentItem);
router.delete("/:id", deleteContentItem);

export default router;