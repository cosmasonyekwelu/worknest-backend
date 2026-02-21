import multer from "multer";
// Install Multer to handle file uploads

/**
 * Use memory storage so files can be passed directly
 * to uploadToCloudinary() in the service layer
 */
const storage = multer.memoryStorage();

/**
 * File validation (resume documents only)
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
  }

  cb(null, true);
};

/**
 * Multer middleware instance
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
