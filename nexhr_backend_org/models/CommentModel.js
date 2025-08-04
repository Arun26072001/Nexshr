const mongoose = require("mongoose");
const Joi = require("joi");

const commentSchema = new mongoose.Schema({
    comment: { type: String },
    attachments: [{ type: String , default: []}],
    spend: { type: String, default: 0 },
    date: { type: Date, default: new Date() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true })

const Comment = mongoose.model("Comment", commentSchema);

const commentValidation = Joi.object().keys({
    comment: Joi.string().disallow(" ").required(),
    date: Joi.date().required(),
    createdBy: Joi.any().optional(),
    attachments: Joi.array().items(Joi.string()).optional(),
    isDeleted: Joi.boolean().required(),
    spend: Joi.number().optional(),
    // to avoid update comment validation
    _id: Joi.any().optional(),
    __v: Joi.any().optional(),
    createdAt: Joi.any().optional(),
    updatedAt: Joi.any().optional()
})
module.exports = { Comment, commentValidation }