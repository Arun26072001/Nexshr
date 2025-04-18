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
  placeId: { type: String }
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
    .required(),
  Website: Joi.string()
    .max(2000)
    .required(),
  logo: Joi.string()
    .required(),
  Email: Joi.string()
    .max(1000)
    .required(),
  ContactPerson: Joi.string()
    .max(200)
    .required(),
  ContactNo: Joi.string()
    .max(20)
    .required(),
  FaxNo: Joi.string()
    .max(100)
    .required(),
  Town: Joi.string().required(),
  PanNo: Joi.string()
    .max(200)
    .required(),
  GSTNo: Joi.string()
    .max(200)
    .required(),
  CINNo: Joi.string()
    .max(200)
    .required(),
  placeId: Joi.string()
    .allow("", null)
    .optional()
});


module.exports = {
  Company,
  CompanyValidation,
  companySchema
}