const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var stateSchema = new mongoose.Schema({
    StateName: { type: String, required: true },
    country: [{ type: mongoose.Schema.Types.ObjectId, ref: "Country" , required: true}],
    cities: [{ type: mongoose.Schema.Types.ObjectId, ref: "City" }]
  });
  
  var State = mongoose.model("State", stateSchema);
  autoIncrement.initialize(mongoose.connection);
  stateSchema.plugin(autoIncrement.plugin, {
    model: "State",
    field: "StateID"
  });
  
  const StateValidation = Joi.object().keys({
    _id: Joi.optional(),
    CountryID: Joi.optional(),
    StateName: Joi.string()
      .max(200)
      .required()
  });

  module.exports = {
    State, StateValidation
  }