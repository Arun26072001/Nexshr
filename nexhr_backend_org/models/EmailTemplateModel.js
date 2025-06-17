const mongoose = require("mongoose");
const Joi = require("joi");

const EmailTempSchema = new mongoose.Schema({
    title: { type: String },
    subject: { type: String },
    recipient: [{ type: String }],
    content: { type: String },
    shortTags: [{ type: String }],
    status: { type: Boolean },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "Employee"}
})

const EmailTemplate = mongoose.model("EmailTemplate", EmailTempSchema);

const EmailtempValidation = Joi.object().keys({
    title: Joi.string().required().disallow(null, '', 'none', 'undefined'),
    subject: Joi.string().required().disallow(null, '', 'none', 'undefined'),
    recipient: Joi.array().items(Joi.string().email()).optional(),
    content: Joi.string().required().disallow(null, '', 'none', 'undefined'),
    shortTags: Joi.array().items(Joi.string()).required(),
    status: Joi.boolean().required(),
    createdBy: Joi.any().optional()
})

module.exports = { EmailTemplate, EmailtempValidation }