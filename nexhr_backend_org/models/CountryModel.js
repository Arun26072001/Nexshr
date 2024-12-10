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
    CountryID: Joi.optional(),
    CountryName: Joi.string()
      .max(200)
      .required()
  });

  module.exports = {
    Country, CountryValidation
  }