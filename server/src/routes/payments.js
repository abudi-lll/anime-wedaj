
import { Router } from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import Payment from "../models/Payment.js";
import cloudinary from "../config/cloudinary.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("Receipt must be JPG, PNG, or WEBP."));
    }
    cb(null, true);
  }
});

const prices = { monthly: 199, yearly: 1699 };

router.get("/my", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("-receiptPublicId");

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: "Could not load payments." });
  }
});

router.post("/", protect, upload.single("receipt"), async (req, res) => {
  let uploadedPublicId;

  try {
    const { plan, paymentMethod, transactionId } = req.body;

    if (
      !prices[plan] ||
      !["telebirr", "bank"].includes(paymentMethod) ||
      !transactionId?.trim() ||
      !req.file
    ) {
      return res.status(400).json({
        message: "Choose a plan and payment method, enter the transaction reference, and upload a receipt image."
      });
    }

    const cleanId = transactionId.trim().toUpperCase();

    if (await Payment.findOne({ transactionId: cleanId })) {
      return res.status(409).json({
        message: "That transaction reference has already been submitted."
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "anime-wedaj/payment-receipts",
          resource_type: "image",
          type: "authenticated"
        },
        (error, uploaded) => {
          if (error) reject(error);
          else resolve(uploaded);
        }
      );

      stream.end(req.file.buffer);
    });

    uploadedPublicId = result.public_id;

    const payment = await Payment.create({
      user: req.user._id,
      plan,
      amount: prices[plan],
      paymentMethod,
      transactionId: cleanId,
      receiptPublicId: result.public_id,
      receiptFormat: result.format
    });

    res.status(201).json({
      message: "Payment request submitted. Your Pro access starts after admin verification.",
      payment: { id: payment._id, status: payment.status }
    });
  } catch (err) {
    if (uploadedPublicId) {
      await cloudinary.uploader.destroy(uploadedPublicId, {
        resource_type: "image",
        type: "authenticated"
      }).catch(() => {});
    }

    if (err.code === 11000) {
      return res.status(409).json({
        message: "That transaction reference has already been submitted."
      });
    }

    console.error("Payment submission error:", err);
    res.status(500).json({ message: "Could not submit payment request." });
  }
});

export default router;
