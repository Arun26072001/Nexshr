const mongoose = require('mongoose');
const Joi = require('joi');

const settingsSchema = new mongoose.Schema({
  theme: {
    primaryColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    font: { type: String, required: true },
  },
  notifications: {
    emailNotifications: { type: Boolean, required: true },
    smsNotifications: { type: Boolean, required: true },
    pushNotifications: { type: Boolean, required: true },
  },
  leavePolicies: {
    annualLeave: { type: Number, required: true },
    sickLeave: { type: Number, required: true },
    maternityLeave: { type: Number, required: true },
    paternityLeave: { type: Number, required: true },
  },
}, { _id: false });

const applicationSettingsSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Company" },
  settings: { type: settingsSchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const applicationSettings = mongoose.model('applicationSettings', applicationSettingsSchema);

const settingsValidation = Joi.object({
  theme: Joi.object({
    primaryColor: Joi.string().required(),
    secondaryColor: Joi.string().required(),
    font: Joi.string().required(),
  }).required(),
  notifications: Joi.object({
    emailNotifications: Joi.boolean().required(),
    smsNotifications: Joi.boolean().required(),
    pushNotifications: Joi.boolean().required(),
  }).required(),
  leavePolicies: Joi.object({
    annualLeave: Joi.number().required(),
    sickLeave: Joi.number().required(),
    maternityLeave: Joi.number().required(),
    paternityLeave: Joi.number().required(),
  }).required(),
});

const applicationSettingsValidation = Joi.object({
  companyId: Joi.string().required(),
  settings: settingsValidation.required(),
  createdAt: Joi.date().default(Date.now()),
  updatedAt: Joi.date().default(Date.now()),
});


module.exports = {
  applicationSettings,
  applicationSettingsValidation,
  applicationSettingsSchema
};
