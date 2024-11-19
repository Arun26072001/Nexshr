const express = require('express');
const router = express.Router()
const { Department, DepartmentValidation, departmentSchema } = require('../models/DepartmentModel');
const { Employee } = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');
const { getEmployeeModel } = require('./employee');

const departmentModels = {};

function getDepartmentModel(orgName) {
  // If model already exists in the object, return it; otherwise, create it
  if (!departmentModels[orgName]) {
    departmentModels[orgName] = mongoose.model(`${orgName}Department`, departmentSchema);
  }

  return departmentModels[orgName];
}

router.get("/", async (req, res) => {
  try {
    // const {orgName} = jwt.decode(req.headers['authorization']);
    // const Department = getDepartmentModel(orgName)
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
    // const {orgName} = jwt.decode(req.headers['authorization']);
    // const Department = getDepartmentModel(orgName)
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
      // const {orgName} = jwt.decode(req.headers['authorization']);
      // const Department = getDepartmentModel(orgName)  
      Department.create(req.body, function (err, department) {
        if (err) {
          console.log(err);
          res.status(500).send({ Error: err });
        } else {
          res.send({ message: "new department has been added!" });
        }
      });
    }
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
      // const {orgName} = jwt.decode(req.headers['authorization']);
      // const Department = getDepartmentModel(orgName)  
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
  });
});

router.delete("/:id", verifyAdminHR, (req, res) => {
  // const {orgName} = jwt.decode(req.headers['authorization']);
  // const OrgEmployeeModel = getEmployeeModel(orgName);
  Employee.find({ department: req.params.id }, function (err, d) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log(d);
      if (d.length == 0) {
        // const Department = getDepartmentModel(orgName)
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