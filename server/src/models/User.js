
import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema({
  anime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Anime",
    required: true
  },
  episodeNumber: {
    type: Number,
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  passwordHash: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  subscription: {
    plan: {
      type: String,
      enum: ["monthly", "yearly", null],
      default: null
    },
    status: {
      type: String,
      enum: ["inactive", "active"],
      default: "inactive"
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },

  watchHistory: [watchHistorySchema]

}, { timestamps: true });

export default mongoose.model("User", userSchema);

