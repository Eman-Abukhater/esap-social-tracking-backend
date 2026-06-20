import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";
import type { JwtPayload } from "../middlewares/auth";

const TOKEN_EXPIRY = "8h";

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const payload: JwtPayload = { userId: user.id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: TOKEN_EXPIRY });

  res.cookie("token", token, getCookieOptions());
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.actingUser!.id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});
