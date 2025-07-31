const Joi = require("joi");
const mongoose = require("mongoose");

const TimezoneSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    name: { type: String },
    timeZone: { type: String },
     isDeleted: {type: Boolean, default: false},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
})

const Timezone = mongoose.model("Timezone", TimezoneSchema);

const timeZoneValidation = Joi.object({
    _id: Joi.any().optional(),
    __v: Joi.any().optional(),
    createdBy: Joi.any().optional(),
    isDeleted: Joi.any().optional(),
    company: Joi.string().regex(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/).required(),
    name: Joi.string().disallow(null, '', 'none', 'undefined').required(),
    timeZone: Joi.string().disallow(null, '', 'none', 'undefined').required()
})

module.exports = { Timezone, timeZoneValidation }