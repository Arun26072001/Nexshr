const express = require("express");
const { Employee } = require("../models/EmpModel");
const { Payslip } = require("../models/PaySlipModel");
const { getWeekdaysOfCurrentMonth, sumLeaveDays, errorCollector } = require("../Reuseable_functions/reusableFunction");
const { Holiday } = require("../models/HolidayModel");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const payslip = await Payslip.findById({ _id: req.params.id }).populate({
      path: "employee",
      populate: [
        { path: "company", select: "CompanyName logo" },
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
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: error.message })
  }
})

router.post("/", async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

  try {
    // Fetch employees with unpaid leave in the current month
    const employees = await Employee.find({}, "basicSalary payslipFields payslip leaveApplication company").populate({
      path: "leaveApplication",
      match: {
        $or: [
          { fromDate: { $lte: endOfMonth } },
          { toDate: { $gte: startOfMonth } }
        ],
        leaveType: "Unpaid Leave (LWP)",
        status: "approved"
      }
    })
      .exec();
    if (!employees.length) {
      return res.status(404).json({ message: "No employees found" });
    }

    let unPayslipFieldsEmps = [];
    let payslipGendratedEmps = [];

    const payslipPromises = employees.map(async (emp) => {
      let currentMonthOfLeaveDays = [];
      if (emp.company) {
        const response = await Holiday.findOne({ currentYear: startOfMonth.getFullYear(), company: emp.company }).exec();
        if (response?.holidays?.length) {
          currentMonthOfLeaveDays = response.holidays.filter((holiday) => new Date(holiday.date).getMonth() === startOfMonth.getMonth()).map((item) => new Date(item.date).getDate())
        }
      }

      if (emp.basicSalary && emp.payslipFields) {
        const perDayOfSalary = emp.basicSalary ? Number(emp.basicSalary) / getWeekdaysOfCurrentMonth(startOfMonth.getFullYear(), startOfMonth.getMonth(), currentMonthOfLeaveDays) : 0;
        const leaveDays = await sumLeaveDays(emp.leaveApplication);

        const payslip = {
          payslip: {
            ...emp.payslipFields,
            date: new Date(),
            basicSalary: emp.basicSalary,
            LossOfPay: Number((leaveDays * perDayOfSalary).toFixed(2)),
            status: "pending",
            period: `${startOfMonth.toLocaleString("default", { month: "long" })} ${startOfMonth.getFullYear()}`,
            lopDays: leaveDays,
            paidDays: `${getWeekdaysOfCurrentMonth(startOfMonth.getFullYear(), startOfMonth.getMonth(), currentMonthOfLeaveDays)}`
          },
          employee: emp._id
        };

        const payslipData = await Payslip.create(payslip);
        emp.payslip.push(payslipData._id);
        await emp.save();
        payslipGendratedEmps.push(emp._id)
      } else {
        unPayslipFieldsEmps.push(emp._id);
      }
    });

    await Promise.all(payslipPromises);
    res.json({ message: `Payslips have been generated for ${payslipGendratedEmps.length} people and ${unPayslipFieldsEmps.length} people for not assign PayslipFields` });

  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("Error generating payslips:", err);
    res.status(500).json({ message: "An error occurred while generating payslips", error: err.message });
  }
});

router.get("/emp/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  
  // need to check
  try {
    const dateRangeValue = req.query?.dateRangeValue;
    let filterObj = {
      employee: req.params.empId,
    }
    let fromDate, toDate;
    if (dateRangeValue && dateRangeValue.length > 0) {
      [fromDate, toDate] = dateRangeValue.map((date) => new Date(date));
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 0);
      filterObj = {
        employee: req.params.empId,
        date: { $lte: fromDate, $gte: toDate }
      }
    }
    let payslips = await Payslip.find(filterObj).populate("employee", "FirstName LastName payslip basicSalary profile").exec();
    console.log("payslips", payslips);
    const arrangedPayslips = payslips.sort((a, b) => new Date(String(a.payslip.period)) - new Date(String(b.payslip.period)))
    const pendingPayslips = arrangedPayslips.filter((slip) => slip.payslip.status === "pending");
    const conflitPayslips = arrangedPayslips.filter((slip) => slip.payslip.status === "conflict");
    const successPayslips = arrangedPayslips.filter((slip) => slip.payslip.status === "success");
    return res.send({
      arrangedPayslips,
      pendingPayslips,
      conflitPayslips,
      successPayslips
    })
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: err.message })
  }
})

module.exports = router;