import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { makeToken, publicUser } from "../utils/token.js";
const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8)
      return res.status(400).json({ message: "Enter your name, a valid email, and a password of at least 8 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered." });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { res.status(500).json({ message: "Could not create account." }); }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
    return res.status(401).json({ message: "Email or password is incorrect." });
  res.json({ token: makeToken(user), user: publicUser(user) });
});

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-passwordHash");
  res.json({ user: publicUser(user) });
});
export default router;
