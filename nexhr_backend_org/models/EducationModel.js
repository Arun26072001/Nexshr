var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var educationSchema = new mongoose.Schema({
    SchoolUniversity: { type: String, required: true },
    Degree: { type: String, required: true },
    Grade: { type: String, required: true },
    PassingOfYear: { type: String, required: true }
  });
  
  autoIncrement.initialize(mongoose.connection)
  educationSchema.plugin(autoIncrement.plugin, {
    model: "Education",
    field: "EducationID"
  });
  var Education = mongoose.model("Education", educationSchema);

  const EducationValidation = Joi.object().keys({
    SchoolUniversity: Joi.string()
      .max(200)
      .required(),
    Degree: Joi.string()
      .max(200)
      .required(),
    Grade: Joi.string()
      .max(50)
      .required(),
    PassingOfYear: Joi.string()
      .max(10)
      .required()
  });

  module.exports = {
    Education, EducationValidation
  }