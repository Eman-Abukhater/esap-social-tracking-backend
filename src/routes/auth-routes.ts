import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me } from "../controllers/auth-controller";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { LoginBodySchema } from "../lib/schemas";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

const router = Router();

router.post("/login", loginLimiter, validate(LoginBodySchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
