const mongoose = require("mongoose");
const Joi = require("joi");

const wfhSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    fromDate: { type: Date },
    toDate: { type: Date },
    numOfDays: { type: Number },
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    reason: { type: String },
    rejectionReason: { type: String },
    status: { type: String },
    approvers: {
        type: mongoose.Schema.Types.Mixed, default: {}
    }
}, { timestamps: true })

const WFHApplication = mongoose.model("wfhapplications", wfhSchema);

const WFHAppValidation = Joi.object({
    _id: Joi.any().optional(),
    __v: Joi.any().optional(),
    createdAt: Joi.any().optional(),
    updatedAt: Joi.any().optional(),
    employee: Joi.string().required(),
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
    numOfDays: Joi.number().positive().required(),
    reason: Joi.string().max(500).required(),
    rejectionReason: Joi.string().max(500).allow('', null).optional(),
    status: Joi.string()
        .valid('pending', 'approved', 'rejected')
        .required(),
    approvers: Joi.any().optional()
});

module.exports = {
    WFHApplication,
    WFHAppValidation
}