const mongoose = require("mongoose");
const Joi = require("joi");

const PayslipSchema = new mongoose.Schema({
    payrun: {type: String},
    payrunType: {type: String},
    status: {type: String},
    period: {type: String},
    salary: {type: Number}
})

const PaySlip = mongoose.model("payslip", PayslipSchema);

const PaySlipValidation = Joi.object({
    payrun: Joi.string().required().label("payrun"),
    payrunType: Joi.string().required().label("payrunType"),
    status: Joi.string().required().label("status"),
    period: Joi.string().required().label("period"),
    salary: Joi.number().required().label("salary")
})

module.exports = {PaySlip, PaySlipValidation}