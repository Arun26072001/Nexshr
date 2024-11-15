const mongoose = require('mongoose');
const Joi = require('joi');

var stateSchema = new mongoose.Schema({
    StateName: { type: String, required: true },
    country: [{ type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true }],
    cities: [{ type: mongoose.Schema.Types.ObjectId, ref: "City" }]
});

var State = mongoose.model("State", stateSchema);

const StateValidation = Joi.object().keys({
    CountryID: Joi.optional(),
    StateName: Joi.string()
        .max(200)
        .required()
});

module.exports = {
    State, StateValidation
}