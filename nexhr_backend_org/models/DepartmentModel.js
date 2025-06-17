const mongoose = require('mongoose');
const Joi = require('joi');

var departmentSchema = new mongoose.Schema({
  DepartmentName: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }
});

var Department = mongoose.model("Department", departmentSchema);

const DepartmentValidation = Joi.object().keys({
  DepartmentName: Joi.string()
    .max(200)
    .disallow(null, '', 'none', 'undefined')
    .required(),
  company: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .disallow(null, '', 'none', 'undefined')
});

module.exports = { Department, DepartmentValidation, departmentSchema };

// const staticDepartments = [
//   {
//     "company": {},
//     "DepartmentName": "Admin"
//   },
//   {
//     "company": {},
//     "DepartmentName": "Hr"
//   }
// ]

// Department.countDocuments().then(count => {
//   if (count === 0) {
//     Department.insertMany(staticDepartments)
//       .then(() => console.log("Static Departments inserted!"))
//       .catch(err => console.error("Error inserting Departments:", err));
//   } else {
//     console.log("Departments already exist. Skipping static data insertion.");
//   }
// });