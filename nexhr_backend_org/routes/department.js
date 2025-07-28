const express = require('express');
const router = express.Router()
const { Department, DepartmentValidation, departmentSchema } = require('../models/DepartmentModel');
const { Employee } = require('../models/EmpModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { errorCollector } = require('../Reuseable_functions/reusableFunction');

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    // const {orgName} = jwt.decode(req.headers['authorization']);
    // const Department = getDepartmentModel(orgName)
    const departments = await Department.find()
      .populate({
        path: 'company',
        select: '_id CompanyName'
      }).lean();
    res.send(departments);
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: err.message });
  }
});

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).lean()
    res.send(department);
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: err.message });
  }
});

router.post("/", verifyAdminHR, async (req, res) => {
  try {
    const { error } = DepartmentValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const existingDepartment = await Department.findOne({ DepartmentName: req.body.DepartmentName });
    if (existingDepartment) {
      return res.status(400).send({
        error: `${req.body.DepartmentName} Department already exists`,
      });
    }

    const newDepartment = await Department.create(req.body);

    res.send({ message: `${newDepartment.DepartmentName} department has been added!` });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    const updateDepartment = {
      DepartmentName: req.body.DepartmentName,
      company: req.body.company,
    };

    const { error } = DepartmentValidation.validate(updateDepartment);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: updateDepartment },
      { new: true }
    );

    if (!updatedDepartment) {
      return res.status(404).send({ error: "Department not found." });
    }

    res.send({ message: "Department has been updated!" });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
});

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Check if any employees are associated with this department
    const employees = await Employee.find({ department: departmentId });

    if (employees.length > 0) {
      return res.status(403).send({
        message: "This department is associated with employees, so it cannot be deleted.",
      });
    }
    const deleted = await Department.findByIdAndRemove(departmentId);

    if (!deleted) {
      return res.status(404).send({ message: "Department not found." });
    }

    res.send({ message: "Department has been deleted!" });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("error in delete department", err);
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;