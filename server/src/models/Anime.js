import mongoose from "mongoose";
const episodeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  episodeNumber: { type: Number, required: true, min: 1 },
  videoUrl: { type: String, required: true },
  isFree: { type: Boolean, default: false }
});
const animeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  synopsis: { type: String, default: "" },
  posterUrl: { type: String, default: "" },
  bannerUrl: { type: String, default: "" },
  genres: [{ type: String, trim: true }],
  releaseYear: { type: Number },
  type: { type: String, enum: ["movie", "series"], default: "series" },
  videoUrl: { type: String, default: "" },
  isFree: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  episodes: [episodeSchema]
}, { timestamps: true });
export default mongoose.model("Anime", animeSchema);
