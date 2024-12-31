const multer = require('multer');
const path = require('path');
const express = require("express");
const sharp = require("sharp");

const imgUpload = express.Router();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/uploads/');
  },
  filename: function (req, file, cb) {
    const timePrefix = new Date().toISOString().replace(/[-T:\.Z]/g, '');
    const formattedFilename = `${timePrefix}-${file.originalname.replace(/ /g, "-").toLowerCase()}`;
    cb(null, formattedFilename);
  }
});

// Set up multer instance with the storage configuration
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
      cb(null, true);
    } else {
      cb(new Error('Error: File type not supported!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

// POST route for uploading and converting files
imgUpload.post("/", upload.single("profile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded.' });
    }

    // Define the new file path with a .webp extension
    const newFilePath = `./uploads/${path.parse(req.file.filename).name}.webp`;

    // Use sharp to convert the uploaded file to WebP format
    await sharp(req.file.path)
      .toFormat('webp')
      .toFile(newFilePath);

    // Respond with success message and file details
    res.status(200).send({
      message: 'File uploaded and converted successfully!',
      originalFile: req.file.filename,
      convertedFile: path.basename(newFilePath),
    });

  } catch (error) {
    console.error(error);

    // Handle errors gracefully
    res.status(500).send({ message: error.message });
  }
});

module.exports = { imgUpload, upload };
