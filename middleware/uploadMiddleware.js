const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || "pickup-photos";
    cb(null, path.join(__dirname, "..", "uploads", folder));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image uploads are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }
});

const usePickupPhotoFolder = (req, res, next) => {
  req.uploadFolder = "pickup-photos";
  next();
};

const useProofPhotoFolder = (req, res, next) => {
  req.uploadFolder = "proof-photos";
  next();
};

module.exports = { upload, usePickupPhotoFolder, useProofPhotoFolder };
