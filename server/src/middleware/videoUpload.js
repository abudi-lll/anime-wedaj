
import multer from "multer";
import os from "os";

const videoUpload = multer({
    dest: os.tmpdir(),
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith("video/")) {
            return callback(new Error("Please select a valid video file."));
        }

        callback(null, true);
    }
});

export default videoUpload;
