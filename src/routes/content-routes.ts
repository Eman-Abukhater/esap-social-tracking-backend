import { Router } from "express";
import {
  createContentItem,
  getContentItems,
} from "../controllers/content-controller";

const router = Router();

router.get("/", getContentItems);
router.post("/", createContentItem);

export default router;