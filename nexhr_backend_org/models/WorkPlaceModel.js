const mongoose = require('mongoose');
var Joi = require('joi');

const WorkPlaceSchema = mongoose.Schema({
    CompanyName: {type: String, unique: true},
    Address_1: {type: String},
    Address_2: {type: String},
    Country: {type: String},
    State: {type: String},
    PostCode: {type: Number},
    employees: [{type: mongoose.Schema.Types.ObjectId, ref: "Employee"}],
    Town: {type: String},
})

const WorkPlace = mongoose.model("WorkPlace", WorkPlaceSchema);

  const WorkPlaceValidation = Joi.object().keys({
    _id: Joi.optional(),
    CompanyName: Joi.string()
      .max(100)
      .required(),
    Address_1: Joi.string()
      .max(100)
      .required(),
    Address_2: Joi.string().optional(),
    Country: Joi.string().required(),
    State: Joi.string().required(),
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