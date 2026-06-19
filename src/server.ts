import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { requireAuth } from "./middlewares/auth";
import authRoutes from "./routes/auth-routes";
import userRoutes from "./routes/user-routes";
import productRoutes from "./routes/product-routes";
import contentRoutes from "./routes/content-routes";
import activityRoutes from "./routes/activity-routes";
import dashboardRoutes from "./routes/dashboard-routes";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    maxAge: 86400,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("ESAP Backend Running");
});

app.use("/auth", authRoutes);

app.use(requireAuth);

app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/content", contentRoutes);
app.use("/activity", activityRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
