const express = require('express');
const router = express.Router()
const { Department, DepartmentValidation, departmentSchema } = require('../models/DepartmentModel');
const { Employee } = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');

router.get("/", async (req, res) => {
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
    res.status(500).send({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).lean()
    res.send(department);
  } catch (err) {
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
      return res.status(400).send({ message: error.details[0].message });
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: updateDepartment },
      { new: true }
    );

    if (!updatedDepartment) {
      return res.status(404).send({ message: "Department not found." });
    }

    res.send({ message: "Department has been updated!" });
  } catch (err) {
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
    console.error("error in delete department", err);
    res.status(500).send({ error: err.message });
  }
});


module.exports = router;