const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var countrySchema = new mongoose.Schema({
  CountryName: { type: String, required: true },
  states: [{ type: mongoose.Schema.Types.ObjectId, ref: "State" }]
});

var Country = mongoose.model("Country", countrySchema);

const CountryValidation = Joi.object().keys({
  name: Joi.string().disallow(null, '', 'none', 'undefined').required(),
  icon: Joi.string().optional(),
  abbr: Joi.string().required(),
  code: Joi.string().disallow(null, '', 'none', 'undefined').required(),
  states: Joi.array().items(Joi.string()).optional()
});

module.exports = {
  Country, CountryValidation
}