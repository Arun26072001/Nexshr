const mongoose = require('mongoose');
const Joi = require('joi');

var leaveApplicationSchema = new mongoose.Schema({
  leaveType: { type: String },
  fromDate: { type: Date },
  toDate: { type: Date },
  periodOfLeave: { type: String, default: "full day" },
  reasonForLeave: { type: String, default: "fever" },
  prescription: { type: String },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  coverBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  status: { type: String, default: "pending" },
  TeamLead: { type: String, default: "pending" },
  TeamHead: { type: String, default: "pending" },
  Hr: { type: String, default: "pending" },
  appliedOn: { type: Date, default: new Date().toISOString() },
  approvedOn: { type: Date },
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
});

var LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);

const LeaveApplicationValidation = Joi.object({
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

module.exports = {
  LeaveApplication,
  LeaveApplicationHRValidation,
  LeaveApplicationValidation
};