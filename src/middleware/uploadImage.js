import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/gif"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only image files are allowed (png, jpg, jpeg, webp, gif)"), false);
  }
  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadImage;
