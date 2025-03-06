const mongoose = require('mongoose');

var employeeSchema = new mongoose.Schema({
  FirstName: { type: String },
  LastName: { type: String },
  Email: { type: String },
  Password: { type: String },
  teamLead: { type: mongoose.Types.ObjectId, ref: "Employee", default: null },
  team: { type: mongoose.Types.ObjectId, ref: "Team", default: null },
  countryCode: { type: String },
  phone: { type: String },
  panNumber: { type: String },
  profile: { type: String },
  Account: { type: Number, default: 3 },
  dateOfBirth: { type: String },
  clockIns: [{ type: mongoose.Schema.Types.ObjectId, ref: "clockIns" }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  gender: { type: String },
  monthlyPermissions: { type: Number, default: 2 },
  code: { type: String },
  isLogin: { type: Boolean, default: false },
  serialNo: { type: String },
  working: { type: String, default: "Yes" },
  docType: [{ type: String }],
  leaveApplication: [{ type: mongoose.Schema.Types.ObjectId, ref: "LeaveApplication" }],
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zipCode: { type: String }
  },
  social: { type: mongoose.Schema.Types.Mixed, default: {} },
  position: { type: mongoose.Schema.Types.ObjectId, ref: "Position", default: null },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "RoleAndPermission", default: null },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
  description: { type: String },
  dateOfJoining: { type: String },
  employmentType: { type: String },
  benefits: [{ type: String }],
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Reference to another employee
  emergencyContacts: [
    {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
      email: { type: String }
    }
  ],
  workingTimePattern: {
    type: mongoose.Schema.Types.ObjectId, ref: "TimePattern"
  },
  publicHoliday: {
    type: String
  },
  announcements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Announcement", default: [] }],
  annualLeaveYearStart: {
    type: Date, default: new Date().toISOString()
  },
  companyWorkingHourPerWeek: {
    type: String
  },
  annualLeaveEntitlement: {
    type: Number
  },
  // //financial details
  basicSalary: { type: String },
  lossOfPay: { type: String },
  isVerifyEmail: { type: Boolean, default: false },
  bankName: { type: String },
  accountNo: { type: String }, //should to add unique for this field
  accountHolderName: { type: String },
  IFSCcode: { type: String }, //should to add unique for this field
  taxDeduction: { type: String },
  typesOfLeaveCount: { type: Object },
  typesOfLeaveRemainingDays: { type: Object },
  payslipFields: { type: Object },
  payslip: [{ type: mongoose.Schema.Types.ObjectId, ref: "payslip" }]
}, { timestamps: true });

var Employee = mongoose.model("Employee", employeeSchema);

module.exports = {
  Employee,
  employeeSchema
};


// const EmployeeValidation = Joi.object({
//   FirstName: Joi.string().required(),
//   LastName: Joi.string().required(),
//   Email: Joi.string().email().required(),
//   Password: Joi.string().min(6).required(),
//   teamLead: Joi.string().optional(),
//   managerId: Joi.string().optional(),
//   phone: Joi.string().optional(),
//   Account: Joi.number().optional(),
//   dateOfBirth: Joi.date().optional(),
//   clockIns: Joi.string().optional(),
//   gender: Joi.string().valid("male", "female").optional(),
//   address: Joi.object({
//     street: Joi.string().optional(),
//     city: Joi.string().optional(),
//     state: Joi.string().optional(),
//     zipCode: Joi.string().optional(),
//     country: Joi.string().optional()
//   }).optional(),
//   position: Joi.array().items(Joi.string()).optional(), // Array of MongoDB ObjectId
//   department: Joi.array().items(Joi.string()).optional(), // Array of MongoDB ObjectId
//   company: Joi.array().items(Joi.string()).optional(), // Array of MongoDB ObjectId
//   dateOfJoining: Joi.date().optional(),
//   employmentType: Joi.string().valid("full-time", "part-time", "contract").optional(),
//   benefits: Joi.array().items(Joi.string()).optional(),
//   emergencyContacts: Joi.array().items(
//     Joi.object({
//       name: Joi.string().required(),
//       relationship: Joi.string().required(),
//       phone: Joi.string().optional(),
//       email: Joi.string().email().optional()
//     })
//   ).optional(),
//   workingTimePattern: Joi.string().optional(),
//   publicHoliday: Joi.string().optional(),
//   annualLeaveYearStart: Joi.date().optional(),
//   companyWorkingHourPerWeek: Joi.string().optional(),
//   entitlement: Joi.string().optional(),
//   fullTimeAnnualLeave: Joi.number().optional(),
//   annualLeaveEntitlement: Joi.number().optional()
// });

// const EmployeeValidationUpdate = Joi.object().keys({
//   RoleID: Joi.optional(),
//   PositionID: Joi.optional(),
//   DepartmentID: Joi.optional(),
//   SalaryID: Joi.optional(),
//   FirstName: Joi.string()
//     .max(200)
//     .required(),
//   MiddleName: Joi.string()
//     .max(200)
//     .required(),
//   LastName: Joi.string()
//     .max(200)
//     .required(),
//   Email: Joi.string()
//     .max(200)
//     .required(),
//   Gender: Joi.string()
//     .max(100)
//     .required(),
//   DOB: Joi.date().required(),
//   DateOfJoining: Joi.date().required(),
//   TerminateDate: Joi.date().optional(),
//   Deleted: Joi.optional(),
//   Photo: Joi.optional(),
//   ContactNo: Joi.string()
//     .max(20)
//     .required(),
//   EmployeeCode: Joi.string()
//     .max(100)
//     .required(),
//   Account: Joi.number()
//     .max(3)
//     .required()
// });

// const EmployeePersonalInfoValidation = Joi.object().keys({
//   BloodGroup: Joi.string()
//     .max(10)
//     .required(),
//   DOB: Joi.date().required(),

//   ContactNo: Joi.string()
//     .max(20)
//     .required(),
//   Email: Joi.string()
//     .max(200)
//     .required(),
//   EmergencyContactNo: Joi.string()
//     .max(20)
//     .required(),
//   Gender: Joi.string()
//     .max(100)
//     .required(),
//   Hobbies: Joi.string()
//     .max(1000)
//     .required(),
//   PANcardNo: Joi.string()
//     .max(50)
//     .required(),
//   PermanetAddress: Joi.string()
//     .max(200)
//     .required(),
//   PresentAddress: Joi.string()
//     .max(200)
//     .required()
// });