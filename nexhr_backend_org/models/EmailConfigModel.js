const mongoose = require("mongoose");

const emailConfigSchema = new mongoose.Schema({
    service: { type: String, enum: ["nodemailer", "postmark"], required: true }, // Choose between Nodemailer or Postmark
    mailHost: { type: String }, // For Nodemailer
    mailPort: { type: Number }, // For Nodemailer
    mailPassword: { type: String },
    fromEmail: { type: String, }, // for both
    apiToken: { type: String }, // For Postmark
    isActive: { type: Boolean, default: false },
});

const EmailConfig = mongoose.model("EmailConfig", emailConfigSchema);
module.exports = EmailConfig;
