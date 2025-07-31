const mongoose = require("mongoose");
const Joi = require("joi");

const HolidaySchema = new mongoose.Schema({
    currentYear: { type: Number },
    holidays: [{
        type: mongoose.Schema.Types.Mixed, default: {}
    }],
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
     isDeleted: {type: Boolean, default: false}
})

const Holiday = mongoose.model("holidays", HolidaySchema);

const HolidayValidation = Joi.object().keys({
    _id: Joi.any().optional(),
    __v: Joi.any().optional(),
    createdBy: Joi.any().optional(),
    currentYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required().label("currentYear"),
    holidays: Joi.array().items(Joi.object()).min(2).required("Holidays"),
    company: Joi.string().regex(/^[a-f\d]{24}$/i).required(),
    isDeleted: Joi.any().optional()
})

module.exports = { Holiday, HolidayValidation, HolidaySchema }