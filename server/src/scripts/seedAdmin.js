import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
dotenv.config();
if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error("Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env"); process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 12) { console.error("ADMIN_PASSWORD must be at least 12 characters."); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI);
const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
let admin = await User.findOne({ email });
if (admin) {
  admin.role = "admin";
  admin.passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await admin.save();
} else {
  admin = await User.create({ name: "Anime-wedaj Admin", email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: "admin" });
}
console.log(`Admin ready: ${admin.email}`);
await mongoose.disconnect();
