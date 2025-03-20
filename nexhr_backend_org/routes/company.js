const express = require('express');
const router = express();
const { Company, CompanyValidation } = require('../models/CompanyModel');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const dotenv = require('dotenv');
const { verifyAdminHR,  verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');
const { Department } = require('../models/DepartmentModel');
const { Position } = require('../models/PositionModel');
dotenv.config()

router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
  Company.find().lean()
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

router.put("/:id", verifyAdminHR, (req, res) => {
  let newCompany;

  newCompany = {
    CompanyName: req.body.CompanyName,
    Address: req.body.Address,
    PostalCode: req.body.PostalCode,
    Website: req.body.Website,
    Email: req.body.Email,
    ContactPerson: req.body.ContactPerson,
    ContactNo: req.body.ContactNo,
    FaxNo: req.body.FaxNo,
    PanNo: req.body.PanNo,
    GSTNo: req.body.GSTNo,
    CINNo: req.body.CINNo
  };
  Joi.validate(newCompany, CompanyValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ error: err.details[0].message });
    } else {

      Company.findByIdAndUpdate(req.params.id, newCompany, { new: true }, function (
        err,
        company
      ) {
        if (err) {

          return res.status(500).send({ error: err.message })
        } else {
          res.send({ message: `${company.CompanyName} is updated successfully`, newCompany });
        }
      });
    }
  });
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