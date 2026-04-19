import "dotenv/config";
import express from "express";
import cors from "cors";
import { agreementsRouter } from "./api/agreements";
import { startKeeper } from "./keeper/index";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/agreements", agreementsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
  startKeeper();
});
