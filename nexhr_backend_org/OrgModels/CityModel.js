const mongoose = require('mongoose');
const Joi = require('joi');

var citySchema = new mongoose.Schema({
    CityName: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" }
});

var City = mongoose.model("City", citySchema);

const CityValidation = Joi.object().keys({
    CityName: Joi.string()
        .max(200)
        .required()
});

module.exports = {
    City, CityValidation
}