import { Router } from "express";
import { getContentItems } from "../controllers/content-controller";

const router = Router();

router.get("/", getContentItems);

export default router;