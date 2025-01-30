const express = require('express');
const router = express();
const { Company, CompanyValidation } = require('../models/CompanyModel');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const dotenv = require('dotenv');
const { verifyAdminHR, verifyHR, verifyAdminHREmployee } = require('../auth/authMiddleware');
dotenv.config()

router.get("/", verifyAdminHREmployee, (req, res) => {
  // var employee = {};
  // {path: 'projects', populate: {path: 'portals'}}
  Company.find()
    // .populate({ path: "city", populate: { path: "state" } ,populate: { populate: { path: "country" } } })
    .populate({
      path: "city",
      populate: {
        path: "state",
        model: "State",
        populate: {
          path: "country",
          model: "Country"
        }
      }
    })
    .exec(function (err, compnay) {
      if (err) {
        return res.status(500).send({ error: err.message })
      }
      res.send(compnay);
    });
});

router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, CompanyValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newCompany;

      newCompany = {
        CompanyName: req.body.CompanyName,
        Address: req.body.Address,
        city: req.body.CityID,
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

      Company.create(newCompany, function (err, company) {
        if (err) {
          console.log(err);
          res.send("error");
        } else {
          res.send({ message: "New Company is add sucessfully", company });
        }
      });
      console.log(req.body);
    }
  });
});
router.put("/:id", verifyHR, (req, res) => {
  Joi.validate(req.body, CompanyValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newCompany;

      newCompany = {
        CompanyName: req.body.CompanyName,
        Address: req.body.Address,
        city: req.body.CityID,
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

      Company.findByIdAndUpdate(req.params.id, newCompany, function (
        err,
        company
      ) {
        if (err) {
          res.send("error");
        } else {
          res.send(newCompany);
        }
      });
    }

    console.log("put");
    console.log(req.body);
  });
});

module.exports = router;