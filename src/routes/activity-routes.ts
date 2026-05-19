import { Router } from "express";
import { getActivityLogs } from "../controllers/activity-controller";

const router = Router();

router.get("/", getActivityLogs);

export default router;