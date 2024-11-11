const express = require('express');
const router = express.Router()
const { Department, DepartmentValidation } = require('../models/DepartmentModel');
const { Employee } = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');

router.get("/", async (req, res) => {
  try {
    const departments = await Department.find()
      .populate({
        path: 'company',
        select: '_id CompanyName'
      });
    res.send(departments);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate({
        path: 'company',
        select: '_id CompanyName'
      });
    res.send(department);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, DepartmentValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {

      Department.create(req.body, function (err, department) {
        if (err) {
          console.log(err);
          res.status(500).send({ Error: err });
        } else {
          res.send({ message: "new department has been added!" });
        }
      });
    }
    console.log(req.body);
  });
});

router.put("/:id", verifyAdminHR, (req, res) => {
  let updateDepartment;
  updateDepartment = {
    DepartmentName: req.body.DepartmentName,
    company: req.body.company
  };
  Joi.validate(updateDepartment, DepartmentValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {

      Department.findByIdAndUpdate(req.params.id, {
        $set: updateDepartment
      }, function (
        err,
        department
      ) {
        if (err) {
          res.status(500).send({ message: err.message });
        } else {
          res.send({ message: "department has been updated!" });
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