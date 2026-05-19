import { Router } from "express";
import {
  createContentItem,
  getContentItems,
  updateContentStatus,
} from "../controllers/content-controller";

const router = Router();

router.get("/", getContentItems);
router.post("/", createContentItem);
router.patch("/:id/status", updateContentStatus);

export default router;