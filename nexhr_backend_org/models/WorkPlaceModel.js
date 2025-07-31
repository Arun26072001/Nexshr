const mongoose = require('mongoose');
var Joi = require('joi');

const WorkPlaceSchema = mongoose.Schema({
  CompanyName: { type: String, unique: true },
  Address_1: { type: String },
  Address_2: { type: String },
  Country: { type: String },
  State: { type: String },
  PostCode: { type: Number },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  Town: { type: String },
  isDeleted: { type: Boolean, default: false },
})

const WorkPlace = mongoose.model("WorkPlace", WorkPlaceSchema);

const WorkPlaceValidation = Joi.object().keys({
  _id: Joi.optional(),
  CompanyName: Joi.string()
    .disallow(null, '', 'none', 'undefined')
    .max(100)
    .required(),
  isDeleted: Joi.any().optional(),
  Address_1: Joi.string()
    .disallow(null, '', 'none', 'undefined')
    .max(100)
    .required(),
  Address_2: Joi.string().optional(),
  Country: Joi.string().disallow(null, '', 'none', 'undefined').required(),
  State: Joi.string().disallow(null, '', 'none', 'undefined').required(),
  Town: Joi.string()
    .optional(),
  PostCode: Joi.number().integer().min(10000).max(999999).optional(),
  employees: Joi.optional(),
  _id: Joi.optional(),
  __v: Joi.optional()
});

module.exports = {
  WorkPlace,
  WorkPlaceValidation,
  WorkPlaceSchema
}