import { Router } from "express";

const router = Router();

router.post("/unlock", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }

  if (password !== process.env.APP_ACCESS_PASSWORD) {
    return res.status(403).json({ error: "Invalid password" });
  }

  return res.json({ ok: true });
});

export default router;
