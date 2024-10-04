const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

const payrollSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    payPeriodStart: { type: Date, required: true },
    payPeriodEnd: { type: Date, required: true },
    grossSalary: { type: Number, required: true },
    deductions: { 
        tax: {type: Number},
        healthInsurence: {type: Number},
        otherDeducations: {type: Number}
    },
    netSalary: { type: Number, required: true },
    payDate: { type: Date, required: true }
  });
  

const Payroll = mongoose.model("Payroll", payrollSchema);
payrollSchema.plugin(autoIncrement.plugin, {
    model: "Payroll",
    field: "PayrollID"
})

const PayrollValidation = Joi.object({
    employeeId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).label('Employee ID'),
    payPeriodStart: Joi.date().required().label('Pay Period Start'),
    payPeriodEnd: Joi.date().required().label('Pay Period End'),
    grossSalary: Joi.number().required().label('Gross Salary'),
    deductions: Joi.object({
        tax: Joi.number(),
        healthInsurance: Joi.number(),
        otherDeducations: Joi.number()
    }).required().label('Deductions'),
    netSalary: Joi.number().required().label('Net Salary'),
    payDate: Joi.date().required().label('Pay Date')
  });

module.exports = {
    Payroll,
    PayrollValidation
}