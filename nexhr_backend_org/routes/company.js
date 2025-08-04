const express = require('express');
const router = express();
const jwt = require("jsonwebtoken");
const { Company, CompanyValidation } = require('../models/CompanyModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');
const { Department } = require('../models/DepartmentModel');
const { Position } = require('../models/PositionModel');
const path = require("path");
const fs = require("fs");
const { errorCollector, checkValidObjId } = require('../Reuseable_functions/reusableFunction');

// get all companies
router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    // check is valid objectID
    const decodedData = jwt.decode(req.headers["authorization"]);
    const empId = decodedData?._id;
    const emp = await Employee.findById(empId, "company")
      .populate("company").lean().exec();

    if (!emp && !emp.company) {
      return res.status(404).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    if (!Array.isArray(emp.company)) {
      return res.send([emp.company]);
    } else {
      return res.send(emp.company)
    }
  } catch (err) {
    console.error("Error fetching companies:", err);
    res.status(500).send({ error: err.message });
  }
});

// employee of companies
router.get("/employee/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id, "company")
      .populate("company", "CompanyName")
      .lean().exec();
    if (!emp && !emp.company) {
      return res.status(404).send({ error: "you are not in any company" });
    } else {
      return res.send([emp.company]);
    }
  } catch (error) {
    console.log("error in get emp's company", error);
    return res.status(500).send({ error: error.message })
  }
})

router.get("/:id", verifyAdminHR, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean().exec();

    if (!company) {
      return res.status(404).send({ error: "Company not found" })
    } else {
      return res.send(company);
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
})

router.post("/", verifyAdminHR, async (req, res) => {
  try {
    // Validate request body
    await CompanyValidation.validateAsync(req.body);


    // Check if company already exists
    const companyExists = await Company.exists({ CompanyName: req.body.CompanyName });
    if (companyExists) {
      return res.status(400).send({ error: `${req.body.CompanyName} already exists` });
    }

    // Create company
    const company = await Company.create(req.body);
    return res.status(201).send({ message: "New company added successfully", company });

  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    if (error.isJoi) {
      return res.status(400).send({ error: error.details[0].message });
    }

    console.error(error);
    return res.status(500).send({ error: error.message || "Internal server error" });
  }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    // check validation for company
    const { error } = CompanyValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    } else {
      const oldCompanyData = await Company.findById(req.params.id);
      if (oldCompanyData?.logo && oldCompanyData.logo !== req.body.logo) {
        const filename = oldCompanyData?.logo.split("/").pop();
        const filePath = path.join(__dirname, "..", "uploads", filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old profile image: ${filename}`);
          }
        } catch (error) {
          await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
          console.error("Error deleting profile image:", error.message);
        }
      }
      //update company
      const updateCompany = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.send({ message: `${updateCompany.CompanyName} company is updated successfully` })
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.log("error in update company", error);
    return res.status(500).send({ erorr: error.message })
  }
});

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    // check is valid id
    const { id } = req.params;
    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid or missing Company Id" })
    }

    if (await Employee.exists({ company: req.params.id })) {
      return res.status(400).send({ error: "Some Employees are in this Company, Please remove them." })
    } else if (await Department.exists({ company: req.params.id })) {
      return res.status(400).send({ error: "Some Departments data are using this Comapany, Please remove them" })
    } else if (await Position.exists({ company: req.params.id })) {
      return res.status(400).send({ error: "Some Postions data are using this Comapany, Please remove them" })
    }
    const delte = await Company.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return res.send({ message: `${delte?.CompanyName} Company has been moved to isDeleted` })
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
})

module.exports = router;