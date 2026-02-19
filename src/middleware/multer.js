import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files are allowed"), false);
  }

  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 2MB for logos
  },
});

export default uploadImage;
