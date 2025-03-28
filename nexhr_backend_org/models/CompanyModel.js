const mongoose = require('mongoose');
const Joi = require('joi');

var companySchema = new mongoose.Schema({
  CompanyName: { type: String, },
  Address: { type: String, },
  PostalCode: { type: Number, },
  Website: { type: String, },
  Email: { type: String, },
  ContactPerson: { type: String, },
  ContactNo: { type: String, },
  FaxNo: { type: String, },
  PanNo: { type: String, },
  GSTNo: { type: String, },
  CINNo: { type: String, },
  placeId: { type: String }
}, { timestamps: true });

var Company = mongoose.model("Company", companySchema);

const CompanyValidation = Joi.object().keys({
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