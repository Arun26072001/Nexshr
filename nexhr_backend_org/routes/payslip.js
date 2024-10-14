const express = require("express");
const { Employee } = require("../models/EmpModel");
const { LeaveApplication } = require("../models/LeaveAppModel");
const { PaySlipInfo } = require("../models/PaySlipInfoModel");
const { Payslip } = require("../models/PaySlipModel");
const router = express.Router();

function getDayDifference(leave) {
  let toDate = new Date(leave.toDate);
  let fromDate = new Date(leave.fromDate);
  let timeDifference = toDate - fromDate;
  return timeDifference / (1000 * 60 * 60 * 24);
}

router.post("/", async (req, res) => {
  const now = new Date()
  let startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  try {
    const employees = await Employee.find().populate({
      path: "leaveApplication",
      match: {
        fromDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        },
        toDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    }).exec();
    if (!employees) {
      res.status(404).send({ message: "No Employees in DB" })
    } else {
      employees.map(async (emp) => {
        const perDayOfSalary = Number(emp.basicSalary)/22;
        const payslipFields = await PaySlipInfo.find();
        let leaveDays;
        if (emp?.leaveApplication.length > 0) {
          emp.leaveApplication.map((leave) => leaveDays += getDayDifference(leave))
        }
        let payslip = {};
        payslipFields[0].forEach((field)=>{
            payslip[field.fieldName] = field.value;

            if(payslip.fieldName === "LossOfPay"){
                payslip["LossOfPay"] = leaveDays * perDayOfSalary;
            }
        })
        const body = {
            employee: emp._id,
            payslip
        }
        res.send(body);
        // const genPayslip = await Payslip.create(body);
        // console.log(genPayslip);
        
      })
    }

  } catch (err) {
    console.log(err);

  }
})

module.exports = router;