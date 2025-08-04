const mongoose = require('mongoose');
const Joi = require('joi');

var departmentSchema = new mongoose.Schema({
  DepartmentName: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }
}, {timestamps: true});

var Department = mongoose.model("Department", departmentSchema);

const DepartmentValidation = Joi.object().keys({
  _id: Joi.any().optional(),
  __v: Joi.any().optional(),
  createdAt: Joi.any().optional(),
  deletedAt: Joi.any().optional(),
  DepartmentName: Joi.string()
    .max(200)
    .disallow(null, '', 'none', 'undefined')
    .required(),
  company: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .disallow(null, '', 'none', 'undefined'),
  isDeleted: Joi.any().optional()
});

module.exports = { Department, DepartmentValidation, departmentSchema };