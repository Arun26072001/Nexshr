const express = require("express");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

const imgUpload = express.Router();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, './uploads');
  },
  filename(req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({
  storage,
  // fileFilter: (req, file, cb) => {
  //   // const allowedTypes = null;
  //   // const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  //   // const isValidMime = allowedTypes.test(file.mimetype);

  //   if (isValidExt && isValidMime) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error("Error: File type not supported!"), false);
  //   }
  // },
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

// POST route for uploading and converting files
imgUpload.post("/", upload.array("documents", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ message: "No files uploaded." });
    }

    const convertedFiles = [];

    // Process each uploaded file
    for (const file of req.files) {
      try {
        
        // const originalName = path.parse(file.originalname).name;
        // const webpFileName = `${Date.now()}-${originalName.replace(/ /g, "-").toLowerCase()}.webp`;
        // const newFilePath = path.join(uploadsDir, webpFileName);

        // Convert the in-memory file buffer to WebP format using sharp
        // await sharp(file.buffer)
        //   .toFormat("webp")
        //   .toFile(newFilePath);

        // Add the file details to the result array
        convertedFiles.push({
          originalFile: `${process.env.REACT_APP_API_URL}/uploads/${file.filename}`,
          // convertedFile: `${process.env.REACT_APP_API_URL}/uploads/${webpFileName}`,
        });
      } catch (error) {
        console.error(`Error converting file: ${file.originalname}`, error);
        convertedFiles.push({
          originalFile: `${process.env.REACT_APP_API_URL}/uploads/${file.filename}`,
          error: error.message,
        });
      }
    }

    // Respond with the conversion results
    res.status(200).send({
      message: "Files uploaded and converted successfully!",
      files: convertedFiles,
    });
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = { imgUpload, upload };
