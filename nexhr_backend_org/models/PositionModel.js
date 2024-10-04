const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var positionSchema = new mongoose.Schema({
    PositionName: { type: String, required: true },
    company: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }]
  });
  positionSchema.plugin(autoIncrement.plugin, {
    model: "Position",
    field: "PositionID"
  });
  
  
  const PositionValidation = Joi.object().keys({
      PositionName: Joi.string()
      .max(200)
      .required(),
      CompanyID: Joi.required()
    });
    
    var Position = mongoose.model("Position", positionSchema);

    module.exports = {Position, PositionValidation};