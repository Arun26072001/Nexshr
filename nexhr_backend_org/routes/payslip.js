const express = require("express");
const { Employee } = require("../models/EmpModel");
// const { LeaveApplication } = require("../models/LeaveAppModel");
// const { PaySlipInfo } = require("../models/PaySlipInfoModel");
const { Payslip } = require("../models/PaySlipModel");
const router = express.Router();

function getDayDifference(leave) {
  let toDate = new Date(leave.toDate);
  let fromDate = new Date(leave.fromDate);
  let timeDifference = toDate - fromDate;
  return timeDifference / (1000 * 60 * 60 * 24);
}

router.get("/:id", async (req, res) => {
  try {
    const payslip = await Payslip.findById({ _id: req.params.id }).populate({
      path: "employee",
      populate: [
        { path: "company" },
        { path: "role" },
        { path: "position" },
        { path: "department" }
      ]
    }).exec();
    if (!payslip) {
      res.status(404).send({ message: "invalid payslip Id!" })
    } else {
      res.send(payslip);
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

router.post("/", async (req, res) => {
  const now = new Date();
  let startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0); // End of the current month

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

    if (!employees || employees.length === 0) {
      return res.status(404).send({ message: "No one took leave this month" });
    }

    const payslipPromises = employees.map(async (emp) => {
      const perDayOfSalary = emp.basicSalary ? Number(emp.basicSalary) / 22 : 0;
      let leaveDays = 0;

      // Calculate the total leave days taken in the month
      if (emp.leaveApplication.length > 0) {
        emp.leaveApplication.forEach((leave) => {
          leaveDays += getDayDifference(leave);
        });
      }

      // Create payslip object
      let payslip = {};
      const { payslipFields } = emp;

      Object.entries(payslipFields).forEach(([field, value]) => {
        if (field === "LossOfPay") {
          payslip[field] = Number((leaveDays * perDayOfSalary).toFixed(2));  // Add each field to the payslip object
        } else {
          payslip[field] = value
        }
      });

      payslip['status'] = "pending"
      const month = startOfMonth.toLocaleString("default", { month: "long" })
      payslip['period'] = `${month} ${startOfMonth.getFullYear()}`;

      const body = {
        employee: emp._id,
        payslip
      };

      const payslipData = await Payslip.create(body); // Generate payslip and return the promise

      emp.payslip.push(payslipData._id);
      await emp.save();
    });

    // Wait for all payslip creations to complete
    const generatedPayslips = await Promise.all(payslipPromises);
    res.send({ message: "payslip has been generated for " })

  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({ message: "An error occurred while generating payslips", error: err.message });
  }
});

router.get("/emp/:empId", async (req, res) => {
  try {
    const payslips = await Payslip.find({ employee: req.params.empId }).populate("employee").exec();
    res.send(payslips);
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
})

module.exports = router;