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
  approvers: {
    type: mongoose.Schema.Types.Mixed, default: {}
  },
  appliedOn: { type: Date, default: new Date().toISOString() },
  approvedOn: { type: Date },
  approverId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  whoViewed: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

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
  prescription: Joi.string().allow("", null).optional().label('prescription'),
  coverBy: Joi.any().label('coverBy').allow("", null),
  status: Joi.string().label('status'),
  appliedOn: Joi.date().label('appliedOn'),
  approvers: Joi.any().optional(),
  // TeamLead: Joi.string().allow("", null),
  // TeamHead: Joi.string().allow("", null),
  // Hr: Joi.string().allow("", null),
  // Manager: Joi.string().allow("", null),
  appliedBy: Joi.string().allow("", null)
});

const LeaveApplicationHRValidation = Joi.object().keys({
  status: Joi.string().valid(["pending", "rejected", "approved"]).required()
});

module.exports = {
  LeaveApplication,
  LeaveApplicationHRValidation,
  LeaveApplicationValidation,
  leaveApplicationSchema
};