const mongoose = require('mongoose');
const Joi = require("joi");
// Store schemas for different organizations
const OrgLeaveApplicationSchemas = {};

function getLeaveApplicationSchema(orgName) {
    // If the schema for the organization doesn't exist, create it
    if (!OrgLeaveApplicationSchemas[orgName]) {
        OrgLeaveApplicationSchemas[orgName] = new mongoose.Schema({
            leaveType: { type: String },
            fromDate: { type: Date },
            toDate: { type: Date },
            periodOfLeave: { type: String, default: "full day" },
            reasonForLeave: { type: String, default: "fever" },
            prescription: { type: String },
            employee: { type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Employee` },
            coverBy: { type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Employee`, default: null },
            status: { type: String, default: "pending" },
            appliedOn: { type: Date, default: new Date().toISOString() },
            approvedOn: { type: Date },
            approverId: { type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Employee` }
        })
    }
    return OrgLeaveApplicationSchemas[orgName];
}

// Store models for different organizations
const OrgLeaveApplicationModels = {};

function getLeaveApplicationModel(orgName) {
    // If the model for the organization doesn't exist, create it
    if (!OrgLeaveApplicationModels[orgName]) {
        OrgLeaveApplicationModels[orgName] = mongoose.model(
            `${orgName}_LeaveApplication`, // Collection name
            getLeaveApplicationSchema(orgName)
        );
    }
    return OrgLeaveApplicationModels[orgName];
}

const LeaveApplicationValidation = Joi.object().keys({
    employee: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).label('employee'),
    leaveType: Joi.string().required().label('leaveType'),
    fromDate: Joi.date().required().label('fromDate'),
    toDate: Joi.date().required().label('toDate'),
    reasonForLeave: Joi.string().required().label('reasonForLeave'),
    periodOfLeave: Joi.string().label('periodOfLeave'),
    prescription: Joi.string().label('prescription').allow(""),
    coverBy: Joi.string().label('coverBy').allow("", null),
    status: Joi.string().label('status'),
    appliedOn: Joi.date().label('appliedOn')
});

const LeaveApplicationHRValidation = Joi.object().keys({
    status: Joi.string().valid(["pending", "rejected", "approved"]).required()
});
module.exports = { getLeaveApplicationModel, LeaveApplicationValidation, LeaveApplicationHRValidation }
