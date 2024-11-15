const mongoose = require("mongoose");

const OrgEmployeeSchemas = {};

const getEmployeeSchema = function (orgName) {
    if (!OrgEmployeeSchemas[orgName]) {
        OrgEmployeeSchemas[orgName] = new mongoose.Schema({
            FirstName: { type: String },
            LastName: { type: String },
            Email: { type: String },
            Password: { type: String },
            teamLead: [{ type: mongoose.Types.ObjectId, ref: `${orgName}Employee` }],
            phone: { type: String },
            panNumber: { type: String },
            Account: { type: Number, default: 3 },
            dateOfBirth: { type: String },
            clockIns: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}clockIns` }],
            gender: { type: String },
            code: { type: String },
            serialNo: { type: String },
            working: { type: String, default: "Yes" },
            docType: { type: String },
            leaveApplication: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}LeaveApplication` }],
            address: {
                street: { type: String },
                city: { type: String },
                state: { type: String },
                zipCode: { type: String },
                country: { type: String }
            },
            position: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Position` }],
            department: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Department` }],
            role: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}RoleAndPermission` }],
            company: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Company` }],
            description: { type: String },
            dateOfJoining: { type: String },
            employmentType: { type: String }, // e.g., full-time, part-time, contract
            // salary: [{ type: mongoose.Schema.Types.ObjectId, ref: "Salary" }],
            benefits: [{ type: String }],
            managerId: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Employee` }], // Reference to another employee
            emergencyContacts: [
                {
                    name: { type: String },
                    relationship: { type: String },
                    phone: { type: String },
                    email: { type: String }
                }
            ],
            workingTimePattern: {
                type: mongoose.Schema.Types.ObjectId, ref: `${orgName}TimePattern`
            },
            publicHoliday: {
                type: String
            },
            annualLeaveYearStart: {
                type: Date
            },
            companyWorkingHourPerWeek: {
                type: String
            },
            entitlement: {
                type: String
            },
            fullTimeAnnualLeave: {
                type: Number
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
            payslip: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}payslip` }]
        })
    }
    return OrgEmployeeSchemas[orgName];
}

const employeeModels = {};

function getEmployeeModel(orgName) {
    // If model already exists in the object, return it; otherwise, create it
    if (!employeeModels[orgName]) {
        employeeModels[orgName] = mongoose.model(`${orgName}Employee`, getEmployeeSchema(orgName));
    }
    return employeeModels[orgName];
}

module.exports = {getEmployeeModel}