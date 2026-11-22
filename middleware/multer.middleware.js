import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import ApiError from "../utils/ApiError.js";

const ALLOWED_FILES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const createImageUpload = (folderPath, maxSize = 2) => {
  //Auto create the folder if not present
  fs.mkdirSync(folderPath, { recursive: true });
  //Disk storage (Where and What)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, folderPath),
    filename: (req, file, cb) => {
      const ext = ALLOWED_FILES[file.mimetype] || ".bin";
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
  const fileFilter = (req, file, cb) => {
    if (ALLOWED_FILES[file.mimetype]) {
      return cb(null, true);
    }
    cb(
      new ApiError(400, "Invalid file type. Allowed: JPEG, PNG, WebP, GIF"),
      false,
    );
  };
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSize * 1024 * 1024 },
  });
};
export const uploadCategoryIcon = createImageUpload("upload/category", 2);
export const uploadProductImages = createImageUpload("upload/products", 2);
