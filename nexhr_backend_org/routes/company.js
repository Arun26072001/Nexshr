const express = require('express');
const router = express();
const { Company, CompanyValidation } = require('../models/CompanyModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');
const { Department } = require('../models/DepartmentModel');
const { Position } = require('../models/PositionModel');
const path = require("path");
const fs = require("fs");

router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
  Company.find({}, "CompanyName").lean()
    .exec(function (err, compnay) {
      if (err) {
        return res.status(500).send({ error: err.message })
      }
      res.send(compnay);
    });
});

router.get("/:id", verifyAdminHR, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean().exec();

    if (!company) {
      return res.status(404).send({ error: "Company not found" })
    } else {
      return res.send(company);
    }
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, CompanyValidation, async (err, result) => {
    if (err) {
      return res.status(400).send({ error: err.details[0].message });
    } else {
      if (await Company.exists({ CompanyName: req.body.CompanyName })) {
        return res.status(400).send({ error: `${req.body.CompanyName} is already exists` })
      }

      Company.create(req.body, { new: true }, function (err, company) {
        if (err) {
          console.log(err);

          return res.status(500).send({ error: err.message })
        } else {
          res.send({ message: "New Company is add sucessfully", company });
        }
      });
      console.log(req.body);
    }
  });
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
          console.error("Error deleting profile image:", error.message);
        }
      }
      //update company
      const updateCompany = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.send({ message: `${updateCompany.CompanyName} company is updated successfully` })
    }
  } catch (error) {
    console.log(error);

    return res.status(500).send({ erorr: error.message })
  }
});

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    if (await Employee.exists({ company: req.params.id })) {
      return res.status(400).send({ error: "Some Employees are in this Company, Please remove them." })
    } else if (await Department.exists({ company: req.params.id })) {
      return res.status(400).send({ error: "Some Departments data are using this Comapany, Please remove them" })
    } else if (await Position.exists({ company: req.params.id })) {
      return res.status(400).send({ error: "Some Postions data are using this Comapany, Please remove them" })
    }
    const delte = await Company.findByIdAndDelete(req.params.id);
    return res.send({ message: "Company has been deleted" })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

module.exports = router;