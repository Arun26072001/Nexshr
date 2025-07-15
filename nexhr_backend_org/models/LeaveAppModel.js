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
  approvers: { type: mongoose.Schema.Types.Mixed, default: {} },
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
  leaveType: Joi.string().label('leaveType').disallow(null, ' ', 'none', 'undefined').required().messages({
    "string.disallow": "leaveType is required"
  }),
  fromDate: Joi.date().required().label('fromDate'),
  toDate: Joi.date().greater(Joi.ref('fromDate')).required().label('toDate').messages({
    'date.greater': '"toDate" must be greater than "fromDate"',
  }),
  applyFor: Joi.any().optional(),
  employee: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().label('employee'),
  reasonForLeave: Joi.string().required().disallow(null, ' ', 'none', 'undefined').label('reasonForLeave'),
  periodOfLeave: Joi.string().label('periodOfLeave'),
  prescription: Joi.string().allow(null, ' ', 'none', 'undefined').optional().label('prescription'),
  coverBy: Joi.any().label('coverBy').optional(),
  status: Joi.string().label('status'),
  appliedOn: Joi.date().label('appliedOn'),
  approvers: Joi.any().optional(),
  appliedBy: Joi.string().allow(null, ' ', 'none', 'undefined')
});

const LeaveApplicationHRValidation = Joi.object().keys({
  status: Joi.string().valid("pending", "rejected", "approved").required()
});

module.exports = {
  LeaveApplication,
  LeaveApplicationHRValidation,
  LeaveApplicationValidation,
  leaveApplicationSchema
};