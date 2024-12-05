const multer = require('multer');
const path = require('path');
const express = require("express");
const router = express.Router();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // // Access page_slug from req.body, not from req.file
    // const page_slug = req.body;
    // console.log(req.body);
    

    // // Check if the page_slug exists
    // if (!page_slug) {
    //   return cb(new Error('Page slug is required'), false); // Stop processing if no page_slug
    // }

    // Create a directory for the uploaded files based on page_slug
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    // Format the filename to include the current time and the original file name
    const timePrefix = new Date().toISOString().replace(/[-T:\.Z]/g, '');
    const formattedFilename = timePrefix + '-' + file.originalname.replace(/ /g, "-").toLowerCase();
    cb(null, formattedFilename);
  }
});

// Set up multer instance with the storage configuration
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Define file types allowed
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(new Error('Error: File type not supported!'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Optional: Limit file size to 10MB
});

// POST route for uploading files
router.post("/", upload.single("profile"), (req, res) => {
  try {
    console.log(req.body)

    // Access the uploaded file
    const uploadedFile = req.file;

    // If no file is uploaded or no page_slug is provided, return an error
    if (!uploadedFile) {
      return res.status(400).send({ message: 'No file uploaded.' });
    }

    // Respond with success message and file details
    res.status(200).send({
      message: 'File uploaded successfully!',
      file: uploadedFile
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
