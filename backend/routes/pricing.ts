import { Router, type Request, type Response } from "express";
import { getPriceRecommendation } from "../services/pricing.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const result = await getPriceRecommendation(req.body);
    res.json(result);
  } catch (err) {
    console.error("Pricing error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as pricingRouter };
