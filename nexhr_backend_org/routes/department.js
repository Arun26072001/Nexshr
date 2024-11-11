const express = require('express');
const router = express.Router()
const { Department, DepartmentValidation } = require('../models/DepartmentModel');
const { Employee } = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');


const jwtKey = process.env.ACCCESS_SECRET_KEY;

router.get("/", async (req, res) => {
  try {
    const departments = await Department.find()
    .populate({
      path: 'company',
      select: '_id CompanyName' 
    });
    res.send(departments);
  } catch (err) {
    res.status(500).send({ Error: err.message });
  }
});


router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, DepartmentValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newDepartment;

      newDepartment = {
        DepartmentName: req.body.DepartmentName,
        company: req.body.CompanyID
      };

      Department.create(newDepartment, function (err, department) {
        if (err) {
          console.log(err);
          res.status(500).send({ Error: err });
        } else {
          res.send("new department has been added!");
        }
      });
    }
    console.log(req.body);
  });
});

router.put("/:id", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, DepartmentValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let updateDepartment;

      updateDepartment = {
        DepartmentName: req.body.DepartmentName,
        company: req.body.CompanyID
      };

      Department.findByIdAndUpdate(req.params.id, {
        $set: updateDepartment
      }, function (
        err,
        department
      ) {
        if (err) {
          res.status(500).send(err, "check url and data");
        } else {
          res.send("department has been updated!");
        }
      });
    }

    console.log("put");
    console.log(req.body);
  });
});

router.delete("/:id", verifyAdminHR, (req, res) => {
  Employee.find({ department: req.params.id }, function (err, d) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log(d);
      if (d.length == 0) {
        Department.findByIdAndRemove({ _id: req.params.id }, function (
          err,
          department
        ) {
          if (!err) {
            res.send("deparment has been deleted!");
          }
        });
        console.log("delete");
        console.log(req.params.id);
      } else {
        res
          .status(403)
          .send(
            "This department is associated with Employee so you can not delete this"
          );
      }
    }
  });
});

module.exports = router;