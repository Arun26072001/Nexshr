const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
const Joi = require("joi");

let CompanySettingsSchema = mongoose.Schema({
  CompanyName: { type: String },
  EmpStatus: { type: Number },
  EmpEmail: { type: Number },
  EmpInfo: { type: Number },
  AllowOvertime: { type: Number },
  RecordOvertime: { type: Number },
  ToilLeaveApproval: { type: Number },
  AbsenceConflict: { type: Number },
  AnnualLeaveCarryOver: { type: Number },
  EmpLeaveCancel: { type: Number },
  RotasPermissions: { type: Number },
  HideLabelForEmp: { type: Number }
})

var CompanySettings = mongoose.model("CompanySettings", CompanySettingsSchema);
// autoIncrement.initialize(mongoose.connection);
// CompanySettingsSchema.plugin(autoIncrement.plugin, {
//   model: "CompanySettings",
//   field: "CompanyID"
// });

const CompanySettingsValidation = Joi.object().keys({
  _id: Joi.optional(),
  CompanyName: Joi.string()
    .max(100)
    .required(),
  EmpStatus: Joi.number()
    .max(2)
    .required(),
  EmpEmail: Joi.number()
    .max(2)
    .required(),
  EmpInfo: Joi.number()
    .max(2)
    .required(),
  AllowOvertime: Joi.number()
    .max(2)
    .required(),
  RecordOvertime: Joi.number()
    .max(2)
    .required(),
  ToilLeaveApproval: Joi.number()
    .max(2)
    .required(),
  AbsenceConflict: Joi.number()
    .max(2)
    .required(),
  AnnualLeaveCarryOver: Joi.number()
    .max(2)
    .required(),
  EmpLeaveCancel: Joi.number()
    .max(2)
    .required(),
  RotasPermissions: Joi.number()
    .max(2)
    .required(),
  HideLabelForEmp: Joi.number()
    .max(2)
    .required()
});

module.exports = {
  CompanySettings,
  CompanySettingsValidation
}