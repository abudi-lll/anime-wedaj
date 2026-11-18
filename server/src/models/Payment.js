
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  plan: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "ETB"
  },
  paymentMethod: {
    type: String,
    enum: ["telebirr", "bank"],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  receiptPublicId: {
    type: String,
    required: true
  },
  receiptFormat: {
    type: String,
    default: "jpg"
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  adminNote: {
    type: String,
    default: ""
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

paymentSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model("Payment", paymentSchema);
