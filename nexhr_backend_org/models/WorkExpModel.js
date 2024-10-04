const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var workExperienceSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    designation: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true }
  });
  
  // autoIncrement.initialize(mongoose.connection);
  // workExperienceSchema.plugin(autoIncrement.plugin, {
  //   model: "WorkExperience",
  //   field: "WorkExperienceID"
  // });
  
  var WorkExperience = mongoose.model("WorkExperience", workExperienceSchema);
  
  const WorkExperienceValidation = Joi.object().keys({
    CompanyName: Joi.string()
      .max(200)
      .required(),
    Designation: Joi.string()
      .max(200)
      .required(),
    FromDate: Joi.date().required(),
    ToDate: Joi.date().required()
  });

  module.exports = {
    WorkExperience,
    WorkExperienceValidation
  }