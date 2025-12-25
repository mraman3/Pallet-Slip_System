// src/app.ts
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";

import { requireAppAccess } from "./middleware/appAccess";

import healthRoutes from "./routes/health";
import unlockRoutes from "./routes/unlock";

import slipsRoutes from "./routes/dataRoutes/slips";
import slipsPdfRoutes from "./routes/dataRoutes/slipsPdf";
import clientsRoutes from "./routes/dataRoutes/clients";
import addressesRoutes from "./routes/dataRoutes/addresses";
import palletTypesRoutes from "./routes/dataRoutes/palletTypes";
import clerksRoutes from "./routes/dataRoutes/clerks";

export const app = express();

// -----------------------------
// Basic middleware
// -----------------------------
app.use(cors());
app.use(express.json());

// -----------------------------
// Request logging (see section 2)
// -----------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const diffNs = Number(process.hrtime.bigint() - start);
    const ms = diffNs / 1_000_000;

    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
        `${res.statusCode} ${ms.toFixed(1)}ms`
      );
    }
  });

  next();
});

// -----------------------------
// Health route (root-level)
// -----------------------------
app.use(healthRoutes); // exposes GET /healthz

// pdf api mounted before auth middleware, to allow link sharing if needed 
app.use("/api/slips", slipsPdfRoutes);

// App Login Access Middleware
app.use("/api", unlockRoutes);
app.use("/api", requireAppAccess);

// -----------------------------
// API routes
// -----------------------------
app.use("/api/slips", slipsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/clients/:clientId/addresses", addressesRoutes);
app.use("/api/pallet-types", palletTypesRoutes);
app.use("/api/clerks", clerksRoutes);

// -----------------------------
// Root ping (optional)
// -----------------------------
app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Pallet Slip API" });
});

// -----------------------------
// Central error handler
// -----------------------------
// (MUST be last middleware)
app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
  ) => {
    console.error("Unhandled error:", {
      method: req.method,
      url: req.originalUrl,
      err,
    });

    if (res.headersSent) {
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
);
