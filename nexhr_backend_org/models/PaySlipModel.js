const mongoose = require("mongoose");
const Joi = require("joi");

const PayslipSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "employee" },
    payrun: { type: String },
    payrunType: { type: String },
    status: { type: String },
    period: { type: String },
    // earnings
    houseRendAllowance: { type: Number },
    conveyanceAllowance: { type: Number },
    othersAllowance: { type: Number },
    bonusAdvance: { type: Number },
    // deducations
    incomeTax: { type: Number },
    providentFund: { type: Number },
    proffssionalTax: { type: Number },
    ESI: { type: Number }
})

const PaySlip = mongoose.model("payslip", PayslipSchema);

const payslipValidation = Joi.object({
    // Employee reference
    employee: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),  // MongoDB ObjectId format
  
    // Payrun details
    payrun: Joi.string().required(),
    payrunType: Joi.string().valid("monthly", "bi-weekly", "weekly").required(), // Example types
    status: Joi.string().valid("paid", "pending", "failed").required(),
    period: Joi.string().required(),
  
    // Earnings
    houseRendAllowance: Joi.number().min(0).optional(),
    conveyanceAllowance: Joi.number().min(0).optional(),
    othersAllowance: Joi.number().min(0).optional(),
    bonusAdvance: Joi.number().min(0).optional(),
  
    // Deductions
    incomeTax: Joi.number().min(0).optional(),
    providentFund: Joi.number().min(0).optional(),
    proffssionalTax: Joi.number().min(0).optional(),
    ESI: Joi.number().min(0).optional()
  });

module.exports = { PaySlip, payslipValidation }