import { Router } from "express";
import { getActivityLogs } from "../controllers/activity-controller";
import { validate } from "../middlewares/validate";
import { GetActivityQuerySchema } from "../lib/schemas";

const router = Router();

router.get("/", validate(GetActivityQuerySchema, "query"), getActivityLogs);

export default router;
