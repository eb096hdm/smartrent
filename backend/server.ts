import "dotenv/config";
import express from "express";
import cors from "cors";
import { pricingRouter } from "./routes/pricing.js";

const app = express();
const PORT = process.env.BACKEND_PORT ?? 3001;

app.use(cors({ origin: ["http://localhost:8080", "http://127.0.0.1:8080"] }));
app.use(express.json());

app.use("/api/price-recommendation", pricingRouter);

app.listen(Number(PORT), () => {
  console.log(`[BACKEND] API server running on http://localhost:${PORT}`);
  console.log(`[BACKEND] Routes: POST /api/price-recommendation`);
});
