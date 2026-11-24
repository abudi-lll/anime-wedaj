
import { Router } from "express";
import Anime from "../models/Anime.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import { protect, adminOnly } from "../middleware/auth.js";
import videoUpload from "../middleware/videoUpload.js";

const router = Router();

// Only authenticated admins can access these routes.
router.use(protect, adminOnly);

// ==============================
// ADMIN OVERVIEW
// ==============================
router.get("/overview", async (_req, res) => {
  try {
    const [users, anime, pendingPayments, approvedPayments] =
      await Promise.all([
        User.countDocuments(),
        Anime.countDocuments(),
        Payment.countDocuments({ status: "pending" }),
        Payment.countDocuments({ status: "approved" })
      ]);

    res.json({
      users,
      anime,
      pendingPayments,
      approvedPayments
    });
  } catch (err) {
    console.error("Admin overview error:", err);
    res.status(500).json({ message: "Could not load admin overview." });
  }
});

// ==============================
// VIEW PAYMENT RECEIPT (CLOUDINARY)
// ==============================
router.get("/payments/:id/receipt", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .select("receiptPublicId receiptFormat");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (!payment.receiptPublicId) {
      return res.status(404).json({ message: "Receipt not found." });
    }

    const url = cloudinary.utils.private_download_url(
      payment.receiptPublicId,
      payment.receiptFormat || "jpg",
      {
        resource_type: "image",
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 300
      }
    );

    return res.redirect(url);
  } catch (err) {
    console.error("Receipt viewing error:", err);

    return res.status(500).json({
      message: "Could not retrieve receipt."
    });
  }
});

// ==============================
// LIST ALL PAYMENTS
// ==============================
router.get("/payments", async (_req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ payments });
  } catch (err) {
    console.error("Admin payments error:", err);
    res.status(500).json({ message: "Could not load payments." });
  }
});

// ==============================
// APPROVE OR REJECT PAYMENT
// ==============================
router.patch("/payments/:id", async (req, res) => {
  try {
    const { decision, adminNote = "" } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision." });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (payment.status !== "pending") {
      return res.status(409).json({
        message: "This payment has already been reviewed."
      });
    }

    if (decision === "approved") {
      const user = await User.findById(payment.user);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const now = new Date();

      const currentExpiry =
        user.subscription?.status === "active" &&
          user.subscription.expiresAt > now
          ? user.subscription.expiresAt
          : now;

      const expiresAt = new Date(currentExpiry);

      if (payment.plan === "monthly") {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      user.subscription = {
        plan: payment.plan,
        status: "active",
        expiresAt
      };

      await user.save();
    }

    payment.status = decision;
    payment.adminNote = String(adminNote).slice(0, 500);
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();

    await payment.save();

    res.json({
      message: `Payment ${decision}.`,
      payment
    });
  } catch (err) {
    console.error("Payment review error:", err);
    res.status(500).json({ message: "Could not review payment." });
  }
});

// ==============================
// ADD ANIME
// ==============================

router.post("/anime", async (req, res) => {
  try {
    const {
      title,
      synopsis,
      posterUrl,
      bannerUrl,
      genres,
      releaseYear,
      type,
      videoUrl,
      isFree,
      published,
      episodes
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Anime title is required."
      });
    }

    const anime = await Anime.create({
      title: title.trim(),
      synopsis,
      posterUrl,
      bannerUrl,
      genres: Array.isArray(genres)
        ? genres
        : String(genres || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      releaseYear,
      type,
      videoUrl,
      isFree: Boolean(isFree),
      published: published !== false,
      episodes: Array.isArray(episodes) ? episodes : []
    });

    res.status(201).json({ anime });
  } catch (err) {
    console.error("Add anime error:", err);
    res.status(500).json({ message: "Could not add anime." });
  }
});

// ==============================
// GENERATE SECURE CLOUDINARY UPLOAD SIGNATURE
// ==============================

router.post("/anime/upload-signature", async (req, res) => {
  try {
    const { timestamp, source } = req.body;
    const folder = "anime-wedaj/videos";

    if (
      !Number.isInteger(timestamp) ||
      source !== "uw" ||
      Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300
    ) {
      return res.status(400).json({
        message: "Invalid upload signature parameters."
      });
    }

    const signature = cloudinary.utils.api_sign_request(
      { folder, source, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);

    res.status(500).json({
      message: "Could not generate upload signature."
    });
  }
});


// ==============================
// LIST ALL ANIME FOR ADMIN
// ==============================
router.get("/anime", async (_req, res) => {
  try {
    const anime = await Anime.find()
      .sort({ createdAt: -1 });

    res.json({ anime });
  } catch (err) {
    console.error("Admin anime list error:", err);
    res.status(500).json({ message: "Could not load anime titles." });
  }
});

// ==============================
// UPDATE EXISTING ANIME
// ==============================
router.put("/anime/:id", async (req, res) => {
  try {
    const {
      title,
      synopsis,
      posterUrl,
      bannerUrl,
      genres,
      releaseYear,
      type,
      videoUrl,
      isFree,
      published,
      episodes
    } = req.body;

    const anime = await Anime.findById(req.params.id);

    if (!anime) {
      return res.status(404).json({ message: "Anime not found." });
    }

    if (title !== undefined) anime.title = title;
    if (synopsis !== undefined) anime.synopsis = synopsis;
    if (posterUrl !== undefined) anime.posterUrl = posterUrl;
    if (bannerUrl !== undefined) anime.bannerUrl = bannerUrl;

    if (genres !== undefined) {
      anime.genres = Array.isArray(genres)
        ? genres
        : String(genres)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    }

    if (releaseYear !== undefined) anime.releaseYear = releaseYear;
    if (type !== undefined) anime.type = type;
    if (videoUrl !== undefined) anime.videoUrl = videoUrl;
    if (isFree !== undefined) anime.isFree = Boolean(isFree);
    if (published !== undefined) anime.published = Boolean(published);
    if (episodes !== undefined) {
      if (!Array.isArray(episodes)) {
        return res.status(400).json({
          message: "Episodes must be an array."
        });
      }

      anime.episodes = episodes;
    }

    await anime.save();

    res.json({
      message: "Anime updated successfully.",
      anime
    });
  } catch (err) {
    console.error("Update anime error:", err);
    res.status(500).json({ message: "Could not update anime." });
  }
});

// ==============================
// DELETE ANIME
// ==============================
router.delete("/anime/:id", async (req, res) => {
  try {
    const anime = await Anime.findByIdAndDelete(req.params.id);

    if (!anime) {
      return res.status(404).json({ message: "Anime not found." });
    }

    res.json({ message: "Anime deleted." });
  } catch (err) {
    console.error("Delete anime error:", err);
    res.status(500).json({ message: "Could not delete anime." });
  }
});

// ==============================
// LIST USERS
// ==============================
router.get("/users", async (_req, res) => {
  try {
    const users = await User.find()
      .select("name email role subscription createdAt")
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({ users });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Could not load users." });
  }
});

export default router;
