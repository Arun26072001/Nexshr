const mongoose = require("mongoose");
const Joi = require("joi");

const errorLogSchema = new mongoose.Schema({
    url: { type: String },
    name: { type: String },
    message: { type: String },
    env: { type: String }
})

const ErrorLog = mongoose.model("errorlogs", errorLogSchema);

const ErrorLogValidation = Joi.object({
    url: Joi.string().optional().disallow(" ", null, "undefined", false),
    name: Joi.string().optional().disallow(" ", null, "undefined", false),
    message: Joi.string().optional().disallow(" ", null, "undefined", false),
    env: Joi.string().optional().disallow(" ", null, "undefined", false)
})

module.exports = { ErrorLogValidation, ErrorLog }