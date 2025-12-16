// src/app.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { prisma } from "./prisma";

import clientsRouter from "./routes/clients";
import addressesRouter from "./routes/addresses";
import clerksRouter from "./routes/clerks";
import palletTypesRouter from "./routes/palletTypes";
import slipsRouter from "./routes/slips";
import slipsPdfRouter from "./routes/slipsPdf";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routers
app.use("/api/clients", clientsRouter);
app.use("/api/clients/:clientId/addresses", addressesRouter);
app.use("/api/clerks", clerksRouter);
app.use("/api/pallet-types", palletTypesRouter);
app.use("/api/slips", slipsRouter);
app.use("/api/slips", slipsPdfRouter);

export { app, prisma };
