const express = require("express");
const multer = require("multer");

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
