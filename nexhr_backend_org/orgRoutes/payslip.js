const express = require("express");
const { getEmployeeModel } = require("../OrgModels/OrgEmpModel");
const { getPayslipModel } = require("../OrgModels/OrgPayslipModel");
const { Org } = require("../OrgModels/OrganizationModel");
const router = express.Router();

function getDayDifference(leave) {
  let toDate = new Date(leave.toDate);
  let fromDate = new Date(leave.fromDate);
  let timeDifference = toDate - fromDate;
  return timeDifference / (1000 * 60 * 60 * 24);
}

router.get("/:orgId/:id", async (req, res) => {
  try {
    const { orgName } = await Org.findById({ _id: req.params.orgId });
    const OrgPayslip =  getOrgPortalModel(orgName)
    const payslip = await OrgPayslip.findById({ _id: req.params.id }).populate({
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

router.post("/:orgId", async (req, res) => {
  const now = new Date();
  let startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0); // End of the current month

  try {
    const { orgName } = await Org.findById({ _id: req.params.orgId });
    const OrgEmployee = getEmployeeModel(orgName)
    const employees = await OrgEmployee.find().populate({
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
      payslip['period'] = `${startOfMonth.getDate()}-${startOfMonth.getMonth() + 1}-${startOfMonth.getFullYear()} to ${endOfMonth.getDate()}-${endOfMonth.getMonth() + 1}-${endOfMonth.getFullYear()}`;


      const body = {
        employee: emp._id,
        payslip
      };
      const OrgPayslip = getPayslipModel(orgName)
      const payslipData = await OrgPayslip.create(body); // Generate payslip and return the promise

      emp.payslip.push(payslipData._id);
      await emp.save();
    });

    // Wait for all payslip creations to complete
    const generatedPayslips = await Promise.all(payslipPromises);
    res.send({ message: "payslip has been generated", Generated: generatedPayslips })

  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({ message: "An error occurred while generating payslips", error: err.message });
  }
});

router.get("/emp/:orgId/:empId", async (req, res) => {
  try {
    const { orgName } = await Org.findById({ _id: req.params.orgId });
    const OrgPayslip = getPayslipModel(orgName)
    const payslips = await OrgPayslip.find({ employee: req.params.empId }).populate("employee").exec();
    res.send(payslips);
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
})

module.exports = router;