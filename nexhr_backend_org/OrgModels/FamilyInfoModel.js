const mongoose = require('mongoose');
const Joi = require('joi');

var familyInfoSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Relationship: { type: String, required: true },
    DOB: { type: Date, required: true },
    Occupation: { type: String, required: true }
  });
  
  var FamilyInfo = mongoose.model("FamilyInfo", familyInfoSchema);
  
  const FamilyInfoValidation = Joi.object().keys({
    Name: Joi.string()
      .max(200)
      .required(),
    Relationship: Joi.string()
      .max(200)
      .required(),
    DOB: Joi.date().required(),
    Occupation: Joi.string()
      .max(100)
      .required()
  });

  module.exports = {
    FamilyInfo,
    FamilyInfoValidation
  };