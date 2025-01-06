const mongoose = require("mongoose");
const Joi = require("joi");

const HolidaySchema = new mongoose.Schema({
    currentYear: { type: String },
    holidays: [{
        type: String
    }]
})

const Holiday = mongoose.model("holidays", HolidaySchema);

const HolidayValidation = Joi.object({
    currentYear: Joi.string().required().label("currentYear"),
    holidays: Joi.array().items(Joi.string()).min(2).required("Holidays")
})

module.exports = { Holiday, HolidayValidation }