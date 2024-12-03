const express = require("express");
const { dynamicPathMiddleware, uploadeImages } = require("../imgStorage");
const router = express.Router();

router.post("/", dynamicPathMiddleware(null, "upload/img"), uploadeImages.single("image"))

module.exports = router;