import { Router } from "express";
import { getProducts, createProduct } from "../controllers/product-controller";
import { requireRole } from "../middlewares/rbac";
import { validate } from "../middlewares/validate";
import { CreateProductBodySchema } from "../lib/schemas";

const router = Router();

router.get("/", getProducts);
router.post(
  "/",
  validate(CreateProductBodySchema),
  requireRole("admin", "manager"),
  createProduct
);

export default router;
