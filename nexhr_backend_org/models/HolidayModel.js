const mongoose = require("mongoose");
const Joi = require("joi");

const HolidaySchema = new mongoose.Schema({
    currentYear: { type: Number },
    holidays: [{
        type: mongoose.Schema.Types.Mixed, default: {}
    }]
})

const Holiday = mongoose.model("holidays", HolidaySchema);

const HolidayValidation = Joi.object().keys({
    currentYear: Joi.number().required().label("currentYear"),
    holidays: Joi.array().items(Joi.object()).min(2).required("Holidays")
})

module.exports = { Holiday, HolidayValidation, HolidaySchema }