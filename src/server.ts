import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user-routes";
import productRoutes from "./routes/product-routes";
import contentRoutes from "./routes/content-routes";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/content", contentRoutes);app.get("/", (_req, res) => {
  res.send("ESAP Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});