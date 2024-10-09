const mongoose = require('mongoose');
const Joi = require('joi');

const payrollSchema = new mongoose.Schema({
    // employee summary
    employee: {type: mongoose.Schema.Types.ObjectId, ref: "employee"},
    // earnings
    houseRendAllowance: {type: Number},
    conveyanceAllowance: {type: Number},
    othersAllowance: {type: Number},
    bonusAdvance: {type: Number},
    // deducations
    incomeTax: {type: Number},
    providentFund: {type: Number},
    proffssionalTax: {type: Number},
    ESI: {type: Number}
  });
  

const Payroll = mongoose.model("Payroll", payrollSchema);

const payrollValidation = Joi.object({
    // employee summary
    employee: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // MongoDB ObjectId format
  
    // earnings
    houseRendAllowance: Joi.number().min(0).optional(),
    conveyanceAllowance: Joi.number().min(0).optional(),
    othersAllowance: Joi.number().min(0).optional(),
    bonusAdvance: Joi.number().min(0).optional(),
  
    // deductions
    incomeTax: Joi.number().min(0).optional(),
    providentFund: Joi.number().min(0).optional(),
    proffssionalTax: Joi.number().min(0).optional(),
    ESI: Joi.number().min(0).optional()
  });

module.exports = {
    Payroll,
    payrollValidation
}