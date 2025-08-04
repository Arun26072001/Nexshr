const express = require('express');
const router = express.Router()
const { Department, DepartmentValidation } = require('../models/DepartmentModel');
const { Employee } = require('../models/EmpModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { errorCollector, checkValidObjId, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    const departments = await Department.find({ isDeleted: false, company: companyId })
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
    // check is valid id
    const { id } = req.params;
    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid or missing Department Id" })
    }
    const department = await Department.findById(id).lean().exec();
    if (!department) {
      return res.status(404).send({ error: "The specified department could not be found. Please refresh and try again." })
    }
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
    const companyId = req.body.company || companyId;
    const existingDepartment = await Department.findOne({ DepartmentName: { $regex: `${req.body.DepartmentName}`, $options: "i" }, company: companyId });
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
    // check is valid id
    const { id } = req.params;
    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid or missing Department Id" })
    }
    // check department is exists
    const depIsExists = await Department.exists({ _id: id })
    if (!depIsExists) {
      return res.status(404).send({ error: "The specified department could not be found. Please refresh and try again." });
    }
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

    res.send({ message: "Department has been updated!", updatedDepartment });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
});

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    // check is valid id
    const departmentId = req.params.id;
    if (!checkValidObjId(departmentId)) {
      return res.status(400).send({ error: "Invalid or missing Department Id" })
    }

    // Check if any employees are associated with this department
    const employees = await Employee.find({ department: departmentId });

    if (employees.length > 0) {
      return res.status(403).send({
        message: "This department is associated with employees, so please change all of them to the team.",
      });
    }
    const deleted = await Department.findByIdAndUpdate(departmentId, { isDeleted: true });

    res.send({ message: `${deleted.DepartmentName} Department has been deleted!` });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("error in delete department", err);
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;