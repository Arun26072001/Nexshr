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
  placeId: { type: String },
  State: { type: String },
  Country: { type: String }
}, { timestamps: true });

var Company = mongoose.model("Company", companySchema);

const CompanyValidation = Joi.object().keys({
  _id: Joi.string().allow("").label('_id'),
  __v: Joi.string().allow(0).label('__v'),
  createdAt: Joi.string().allow('').label('createdAt'),
  updatedAt: Joi.string().allow('').label('updatedAt'),
  CompanyName: Joi.string()
    .max(200)
    .required(),
  Address: Joi.string()
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
    .max(1000)
    .required(),
  ContactPerson: Joi.string()
    .max(200)
    .optional(),
  ContactNo: Joi.string()
    .max(20)
    .optional(),
  FaxNo: Joi.string()
    .max(100)
    .optional(),
  // Town: Joi.string().optional(),
  PanNo: Joi.string()
    .max(200)
    .optional(),
  GSTNo: Joi.string()
    .max(200)
    .optional(),
  CINNo: Joi.string()
    .max(200)
    .optional(),
  placeId: Joi.string()
    .allow("", null)
    .optional(),
  State: Joi.string().required(),
  Country: Joi.string().required()
});


module.exports = {
  Company,
  CompanyValidation,
  companySchema
}