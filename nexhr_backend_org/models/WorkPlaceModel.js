const mongoose = require('mongoose');
var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const WorkPlaceSchema = mongoose.Schema({
    CompanyName: {type: String, unique: true},
    Address_1: {type: String},
    Address_2: {type: String},
    Country: {type: mongoose.Schema.Types.ObjectId, ref: "Country"},
    State: {type: mongoose.Schema.Types.ObjectId, ref: "State"},
    PostCode: {type: Number},
    EmpID: [{type: mongoose.Schema.Types.ObjectId, ref: "Employee"}],
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
    Country: Joi.array().items(Joi.objectId().required()).min(1).required(),
    State: Joi.array().items(Joi.objectId().required()).min(1).required(),
    Town: Joi.string()
    .max(100)
    .required(),
    PostCode: Joi.number().integer().min(10000).max(999999).optional(),
    EmpID: Joi.optional()
  });

  module.exports = {
    WorkPlace,
    WorkPlaceValidation
  }