import type { Request, Response, NextFunction } from "express";

export function requireAppAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["x-app-access"];

  // No header at all
  if (!token || typeof token !== "string") {
    return res.status(401).json({
      error: "App locked — missing access",
    });
  }

  // Wrong password
  if (token !== process.env.APP_ACCESS_PASSWORD) {
    return res.status(403).json({
      error: "Invalid access password",
    });
  }

  // Correct password → allow request
  next();
}
