const express = require('express');
const router = express.Router()
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');
const { getEmployeeModel } = require('./employee');
const { Org } = require('../OrgModels/OrganizationModel');
const { getDepartmentModel } = require('../OrgModels/OrgDepartmentModel');

router.get("/:orgId", async (req, res) => {
  try {
    // const {orgName} = jwt.decode(req.headers['authorization']);
    const { orgName } = await Org.findById({ _id: req.params.orgId });
    const OrgDepartment = getDepartmentModel(orgName)
    const departments = await OrgDepartment.find()
      .populate({
        path: 'orgId'
      });
    res.send(departments);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get("/:orgId/:id", async (req, res) => {
  try {
    const { orgName } = await Org.findById({ _id: req.params.orgId });
    // const {orgName} = jwt.decode(req.headers['authorization']);
    const OrgDepartment = getDepartmentModel(orgName)
    const department = await OrgDepartment.findById(req.params.id)
      .populate({
        path: "orgId"
      });
    res.send(department);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


router.post("/:orgId/", verifyAdminHR, async(req, res) => {
  Joi.validate(req.body, DepartmentValidation, async(err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {
      const { orgName } = await Org.findById({ _id: req.params.orgId });
      // const { orgName } = jwt.decode(req.headers['authorization']);
      const OrgDepartment = getDepartmentModel(orgName)
      OrgDepartment.create(req.body, function (err, department) {
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

router.put("/:orgId/:id", verifyAdminHR, (req, res) => {
  let updateDepartment;
  updateDepartment = {
    DepartmentName: req.body.DepartmentName,
    orgId: req.body.orgId
  };
  Joi.validate(updateDepartment, DepartmentValidation, async(err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {
      const { orgName } = await Org.findById({ _id: req.params.orgId });
      // const { orgName } = jwt.decode(req.headers['authorization']);
      const OrgDepartment = getDepartmentModel(orgName);
      OrgDepartment.findByIdAndUpdate(req.params.id, {
        $set: updateDepartment
      }, function (
        err,
        department
      ) {
        if (err) {
          res.status(500).send({ message: err.message });
        } else {
          res.send({ message: `${department.DepartmentName} has been updated!` });
        }
      });
    }
  });
});

router.delete("/:orgId/:id", verifyAdminHR, async(req, res) => {
  const { orgName } = await Org.findById({ _id: req.params.orgId });
  // const { orgName } = jwt.decode(req.headers['authorization']);
  const OrgEmployeeModel = getEmployeeModel(orgName);
  OrgEmployeeModel.find({ department: req.params.id }, function (err, d) {
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