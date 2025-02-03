const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var countrySchema = new mongoose.Schema({
    CountryName: { type: String, required: true },
    states: [{ type: mongoose.Schema.Types.ObjectId, ref: "State" }]
  });
  
  var Country = mongoose.model("Country", countrySchema);

  const CountryValidation = Joi.object().keys({
    _id: Joi.optional(),
    CountryName: Joi.string()
      .max(200)
      .required(),
      states: Joi.array().items(Joi.string()).min(2).required()
  });

  module.exports = {
    Country, CountryValidation
  }