
const mongoose = require("mongoose");

const PayslipSchema = mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
  payslip: {
    type: mongoose.Schema.Types.Mixed, default: {}
  },
  isDeleted: { type: Boolean, default: false },
}, { minimize: false, timestamps: true })

const Payslip = mongoose.model('payslip', PayslipSchema);

module.exports = { Payslip, PayslipSchema }