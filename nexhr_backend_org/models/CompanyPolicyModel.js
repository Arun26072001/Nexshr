const mongoose = require('mongoose');
const Joi = require('joi');

const CompanyPolicySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true
  },

  // Attendance & Time Settings
  attendance: {
    monthlyPermissionLimit: { type: Number, default: 2, min: 0, max: 10 },
    permissionHourLimit: { type: Number, default: 120, min: 30, max: 480 }, // minutes
    lateLoginPenaltyThreshold: { type: Number, default: 240, min: 60, max: 480 }, // minutes for half-day LOP
    permissionGrantDuration: { type: Number, default: 2, min: 1, max: 8 }, // hours
    warningLimit: { type: Number, default: 3, min: 1, max: 10 },
    overtimeLimit: { type: Number, default: 12, min: 8, max: 16 }, // hours
    defaultStartTime: { type: String, default: "9:00" },
  },

  // Leave Policy Settings
  leave: {
    teamLeaveLimit: { type: Number, default: 2, min: 1, max: 5 }, // max concurrent leaves
    teamWfhLimit: { type: Number, default: 2, min: 1, max: 5 },   // max concurrent WFH
    currentDayPendingApplication: { type: String, default: "reject" },
    autoRejectTime: { type: String, default: "23:59" }, // daily processing time
    annualLeaveDefault: { type: Number, default: 14, min: 5, max: 30 },
    sickLeaveAdvanceApplication: { type: Boolean, default: true }, // allow same day/tomorrow sick leave
    casualLeaveAdvanceApplication: { type: Boolean, default: false }, // require advance application
    medLeavePresc: { type: Boolean, default: false },
    requireHRApproval: { type: Boolean, default: true },
    requireTeamHigherAuthApproval: { type: Boolean, default: true },
    autoApprovePermissions: { type: Boolean, default: true },
  },

  // Payroll Settings
  payroll: {
    generationDate: { type: Date }, // day of month
    salaryCalculationMethod: {
      type: String,
      enum: ['calendar_days', 'working_days'],
      default: 'working_days'
    },
    workingHoursPerDay: { type: Number, default: 8, min: 4, max: 12 }
  },

  // Notification & Processing Settings
  notifications: {
    reminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'disabled'],
      default: 'daily'
    },
    autoProcessingEnabled: { type: Boolean, default: true },
    emailReminders: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true }
  },

  // System Settings
  system: {
    timezone: { type: String, default: "Asia/Kolkata" },
    dateFormat: { type: String, default: "DD/MM/YYYY" },
    timeFormat: { type: String, enum: ['12', '24'], default: '24' },
    weekStartsOn: { type: String, enum: ['Sunday', 'Monday'], default: 'Monday' }
  }
}, {
  timestamps: true
});

require("../ModelChangeEvents/companySettingsHook")(CompanyPolicySchema);

const CompanyPolicy = mongoose.model('CompanyPolicy', CompanyPolicySchema);

// Validation schema
const CompanyPolicyValidation = Joi.object({
  _id: Joi.any().optional(),
  __v: Joi.any().optional(),
  createdAt: Joi.any().optional(),
  updatedAt: Joi.any().optional(),
  company: Joi.string().required(),
  attendance: Joi.object({
    monthlyPermissionLimit: Joi.number().min(0).max(10).optional(),
    permissionHourLimit: Joi.number().min(30).max(480).optional(),
    lateLoginPenaltyThreshold: Joi.number().min(60).max(480).optional(),
    permissionGrantDuration: Joi.number().min(1).max(8).optional(),
    warningLimit: Joi.number().min(1).max(10).optional(),
    overtimeLimit: Joi.number().min(8).max(16).optional(),
    defaultStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }).optional(),
  leave: Joi.object({
    teamLeaveLimit: Joi.number().min(1).max(5).optional(),
    teamWfhLimit: Joi.number().min(1).max(5).optional(),
    autoRejectTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    annualLeaveDefault: Joi.number().min(5).max(30).optional(),
    sickLeaveAdvanceApplication: Joi.boolean().optional(),
    casualLeaveAdvanceApplication: Joi.boolean().optional(),
    requireTeamHigherAuthApproval: Joi.boolean().optional(),
    requireHRApproval: Joi.boolean().optional(),
    medLeavePresc: Joi.boolean().optional(),
    autoApprovePermissions: Joi.boolean().optional(),
  }).optional(),
  payroll: Joi.object({
    generationDate: Joi.date().optional(),
    salaryCalculationMethod: Joi.string().valid('calendar_days', 'working_days').optional(),
    workingHoursPerDay: Joi.number().min(4).max(12).optional()
  }).optional(),
  notifications: Joi.object({
    reminderFrequency: Joi.string().valid('daily', 'weekly', 'disabled').optional(),
    autoProcessingEnabled: Joi.boolean().optional(),
    emailReminders: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional()
  }).optional(),
  system: Joi.object({
    timezone: Joi.string().optional(),
    dateFormat: Joi.string().optional(),
    timeFormat: Joi.string().valid('12', '24').optional(),
    weekStartsOn: Joi.string().valid('Sunday', 'Monday').optional()
  }).optional()
});

module.exports = {
  CompanyPolicy,
  CompanyPolicyValidation,
  CompanyPolicySchema
};
