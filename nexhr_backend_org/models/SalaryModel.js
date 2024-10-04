const mongoose = require('mongoose');
const Joi = require('joi');

var salarySchema = new mongoose.Schema({
    basicSalary: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNo: { type: String, required: true, unique: true },
    accountHolderName: { type: String, required: true },
    IFSCcode: { type: String, required: true, unique: true },
    taxDeduction: { type: String, required: true }
  });
  
  
  var Salary = mongoose.model("Salary", salarySchema);
  // salarySchema.plugin(autoIncrement.plugin, {
  //   model: "Salary",
  //   field: "SalaryID"
  // });

  const SalaryValidation = Joi.object().keys({
    basicSalary: Joi.string()
      .max(20)
      .required(),
    bankName: Joi.string()
      .max(200)
      .required(),
    accountNo: Joi.string()
      .max(200)
      .required(),
    accountHolderName: Joi.string()
      .max(200)
      .required(),
    IFSCcode: Joi.string()
      .max(200)
      .required(),
    taxDeduction: Joi.string()
      .max(100)
      .required()
  });

  module.exports = {
    Salary, SalaryValidation
  }