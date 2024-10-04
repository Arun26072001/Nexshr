const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var citySchema = new mongoose.Schema({
    CityName: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" }
  });
  
  var City = mongoose.model("City", citySchema);
  // autoIncrement.initialize(mongoose.connection)
  // citySchema.plugin(autoIncrement.plugin, {
  //   model: "City",
  //   field: "CityID"
  // });

  const CityValidation = Joi.object().keys({
    _id: Joi.optional(),
    StateID: Joi.optional(),
    CityName: Joi.string()
      .max(200)
      .required()
  });

  module.exports = {
    City, CityValidation
  }