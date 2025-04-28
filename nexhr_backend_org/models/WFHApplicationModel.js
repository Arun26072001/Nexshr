const mongoose = require("mongoose");
const Joi = require("joi");

const wfhSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    fromDate: { type: Date },
    toDate: { type: Date },
    numOfDays: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    reason: { type: String },
    rejectionReason: { type: String },
    status: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
}, { timestamps: true })

const WFHApplication = mongoose.model("wfhApplications", wfhSchema);

const WFHAppValidation = Joi.object({
    employee: Joi.string().required(),
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
    numOfDays: Joi.number().positive().required(),
    reason: Joi.string().max(500).required(),
    rejectionReason: Joi.string().max(500).allow('', null).optional(),
    status: Joi.string()
        .valid('pending', 'approved', 'rejected')
        .required(),
    approvedBy: Joi.string().allow(null).optional(),
});

module.exports = {
    WFHApplication,
    WFHAppValidation
}