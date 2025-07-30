const mongoose = require('mongoose');
const Joi = require('joi');

var companySchema = new mongoose.Schema({
  CompanyName: { type: String },
  Address: { type: String },
  PostalCode: { type: Number, },
  Website: { type: String },
  Email: { type: String },
  logo: { type: String },
  ContactPerson: { type: String },
  ContactNo: { type: String },
  FaxNo: { type: String },
  PanNo: { type: String },
  GSTNo: { type: String },
  CINNo: { type: String },
  State: { type: String },
  Country: { type: String },
  location: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

var Company = mongoose.model("Company", companySchema);

const CompanyValidation = Joi.object().keys({
  _id: Joi.string().allow("").label('_id'),
  __v: Joi.string().allow(0).label('__v'),
  createdAt: Joi.string().optional(),
  updatedAt: Joi.string().optional(),
  CompanyName: Joi.string()
    .max(200)
    .required().disallow(null, ' ', 'none', 'undefined').label("CompanyName"),
  Address: Joi.string()
    .disallow(null, ' ', 'none', 'undefined')
    .max(2000)
    .required(),
  PostalCode: Joi.number()
    .max(999999)
    .optional(),
  Website: Joi.string()
    .max(2000)
    .optional(),
  logo: Joi.string()
    .required(),
  Email: Joi.string()
    .email()
    .max(1000)
    .required().disallow(null, ' ', 'none', 'undefined'),
  ContactPerson: Joi.string()
    .max(200)
    .optional(),
  ContactNo: Joi.string()
    .max(20)
    .optional(),
  FaxNo: Joi.string()
    .regex(/^\+?[0-9]{6,}$/)
    .messages({ "string.pattern.base": "faxno must have at least 6 digits and may start with '+'"})
    .optional(),
  PanNo: Joi.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .max(200)
    .optional(),
  GSTNo: Joi.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9A-Z]{1}$/)
    .max(200)
    .optional(),
  CINNo: Joi.string()
    .regex(/^([LUu]{1})([0-9]{5})([A-Za-z]{2})([0-9]{4})([A-Za-z]{3})([0-9]{6})$/)
    .max(200)
    .optional(),
  placeId: Joi.any().optional(),
  State: Joi.string().required().disallow(null, ' ', 'none', 'undefined'),
  Country: Joi.string().required().disallow(null, ' ', 'none', 'undefined'),
  location: Joi.any().optional()
});

module.exports = {
  Company,
  CompanyValidation,
  companySchema
}