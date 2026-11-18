
import { Router } from "express";
import mongoose from "mongoose";
import Anime from "../models/Anime.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Ethiopia uses UTC+3 and does not observe daylight saving time.
function getEthiopiaDayStart() {
  const now = new Date();
  const ethiopiaTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  return new Date(
    Date.UTC(
      ethiopiaTime.getUTCFullYear(),
      ethiopiaTime.getUTCMonth(),
      ethiopiaTime.getUTCDate()
    ) - 3 * 60 * 60 * 1000
  );
}

function isProMember(user) {
  return (
    user.subscription?.status === "active" &&
    user.subscription?.expiresAt &&
    new Date(user.subscription.expiresAt) > new Date()
  );
}

// Public catalog: never send video URLs here.
router.get("/", async (req, res) => {
  try {
    const filter = { published: true };

    if (req.query.search) {
      filter.title = {
        $regex: String(req.query.search).slice(0, 60),
        $options: "i"
      };
    }

    if (req.query.genre) {
      filter.genres = String(req.query.genre);
    }

    const anime = await Anime.find(filter)
      .select("-videoUrl -episodes.videoUrl")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ anime });
  } catch (err) {
    console.error("Anime list error:", err);
    res.status(500).json({ message: "Could not load anime." });
  }
});

// Public anime details: send information but hide video URLs.
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid anime ID." });
    }

    const anime = await Anime.findOne({
      _id: req.params.id,
      published: true
    })
      .select("-videoUrl -episodes.videoUrl")
      .lean();

    if (!anime) {
      return res.status(404).json({ message: "Anime not found." });
    }

    res.json({ anime });
  } catch (err) {
    console.error("Anime details error:", err);
    res.status(500).json({ message: "Could not load anime details." });
  }
});

// Secure video access. A logged-in user must request each episode.
router.post("/:id/watch", protect, async (req, res) => {
  try {
    const { episodeNumber } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid anime ID." });
    }

    const anime = await Anime.findOne({
      _id: req.params.id,
      published: true
    });

    if (!anime) {
      return res.status(404).json({ message: "Anime not found." });
    }

    let videoUrl = anime.videoUrl;
    let contentIsFree = anime.isFree;
    let selectedEpisodeNumber = 0;

    if (anime.episodes.length > 0) {
      const number = Number(episodeNumber);

      if (!Number.isInteger(number) || number < 1) {
        return res.status(400).json({
          message: "Please select a valid episode."
        });
      }

      const episode = anime.episodes.find(
        (item) => item.episodeNumber === number
      );

      if (!episode) {
        return res.status(404).json({
          message: "Episode not found."
        });
      }

      videoUrl = episode.videoUrl;
      contentIsFree = episode.isFree;
      selectedEpisodeNumber = episode.episodeNumber;
    }

    if (!videoUrl) {
      return res.status(404).json({
        message: "Video source is not available."
      });
    }

    const user = req.user;
    const pro = isProMember(user);
    const admin = user.role === "admin";

    // Pro-only content is never available to free members.
    if (!contentIsFree && !pro && !admin) {
      return res.status(403).json({
        code: "PRO_REQUIRED",
        message: "This episode requires Anime-Wedaj Pro."
      });
    }

    let remainingToday = null;

    // Free members can watch two different free episodes per Ethiopia day.
    if (!pro && !admin) {
      const dayStart = getEthiopiaDayStart();

      const watchedToday = user.watchHistory.filter(
        (entry) => new Date(entry.watchedAt) >= dayStart
      );

      const alreadyWatched = watchedToday.some(
        (entry) =>
          String(entry.anime) === String(anime._id) &&
          entry.episodeNumber === selectedEpisodeNumber
      );

      if (!alreadyWatched && watchedToday.length >= 2) {
        return res.status(403).json({
          code: "DAILY_LIMIT_REACHED",
          message: "You have used your two free episodes for today. Upgrade to Pro for unlimited viewing.",
          remainingToday: 0
        });
      }

      if (!alreadyWatched) {
        user.watchHistory.push({
          anime: anime._id,
          episodeNumber: selectedEpisodeNumber,
          watchedAt: new Date()
        });

        await user.save();
      }

      const updatedCount = watchedToday.length + (alreadyWatched ? 0 : 1);
      remainingToday = Math.max(0, 2 - updatedCount);
    }

    res.json({
      videoUrl,
      remainingToday,
      membership: pro || admin ? "pro" : "free"
    });
  } catch (err) {
    console.error("Video access error:", err);
    res.status(500).json({
      message: "Could not authorize video playback."
    });
  }
});

export default router;
