const mongoose = require("mongoose");
const Joi = require("joi");

const EmailTempSchema = new mongoose.Schema({
    title: { type: String },
    subject: { type: String },
    recipient: [{ type: String }],
    content: { type: String },
    shortTags: [{ type: String }],
    status: { type: String },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "Employee"}
})

const EmailTemplate = mongoose.model("EmailTemplate", EmailTempSchema);

const EmailtempValidation = Joi.object().keys({
    title: Joi.string().required(),
    subject: Joi.string().required(),
    recipient: Joi.array().items(Joi.string().email()).required(),
    content: Joi.string().required(),
    shortTags: Joi.array().items(Joi.string()).required(),
    status: Joi.string().required(),
    createdBy: Joi.any().optional()
})

module.exports = { EmailTemplate, EmailtempValidation }