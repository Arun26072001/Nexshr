const mongoose = require('mongoose');
const Joi = require('joi');

var departmentSchema = new mongoose.Schema({
    DepartmentName: { type: String, required: true },
    company: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }]
  });
  
var Department = mongoose.model("Department", departmentSchema);
  
  const DepartmentValidation = Joi.object().keys({
    DepartmentName: Joi.string()
      .max(200)
      .required(),
    company: Joi.required()
  });

module.exports = {Department, DepartmentValidation};


module.exports.AddNewDepCollection = function(orgName) {
  return mongoose.model(orgName+"Department", departmentSchema)
}