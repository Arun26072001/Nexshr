const express = require('express');
const router = express.Router();
const { Position, PositionValidation, positionSchema } = require('../models/PositionModel');
const { Employee } = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');
const { Org } = require('../models/OrganizationModel');
const mongoose = require("mongoose");

const  positionModel = {};
function getPositionModel(orgName) {
  // If model already exists in the object, return it; otherwise, create it
  if (!positionModel[orgName]) {
    positionModel[orgName] = mongoose.model(`${orgName}Position`, positionSchema);
  } console.log(positionModel);

  return positionModel[orgName];
}

router.get("/", verifyAdminHR, (req, res) => {
  Position.find()
    .populate("company")
    .exec(function (err, positions) {
      if (err) {
        res.status(500).send({ Error: err })
      }
      res.send(positions);
    });
});

router.get("/:id", verifyAdminHR, (req, res) => {
  Position.findById({ _id: req.params.id })
    .populate("company")
    .exec(function (err, position) {
      if (err) {
        res.status(500).send({ Error: err })
      }
      res.send(position);
    });
});

router.post("/:id", async (req, res) => {
  try {
    // Fetch organization data
    const orgData = await Org.findById(req.params.id, "orgName");

    if (!orgData) {
      return res.status(404).send({ error: "Organization data not found!" });
    }

    const { orgName } = orgData;
    console.log("Organization Name:", orgName);

    // Get or create the model for this organization
    const OrgPositionModel = getPositionModel(orgName);
    console.log(OrgPositionModel);

    // Now you can use OrgEmployeeModel to add or query employees for this org
    // Example: adding a new employee
    const newPosition = new OrgPositionModel(req.body);
    await newPosition.save();

    res.status(201).send({ message: "Employee added successfully", position: newPosition });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, PositionValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {

      Position.create(req.body, function (err, position) {
        if (err) {
          res.status(500).send({ message: err.message });
        } else {
          res.send("new Position Added!");
          // console.log("new Role Saved");
        }
      });
    }
    // console.log(req.body);
  });
});

router.put("/:id", verifyAdminHR, (req, res) => {
  let updatedPosition = {
    PositionName: req.body.PositionName,
    company: req.body.company
  }
  Joi.validate(updatedPosition, PositionValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {

      Position.findByIdAndUpdate(req.params.id, updatedPosition, function (
        err,
        position
      ) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send("position has been updated! " + position.PositionName);
        }
      });
    }
  });
});

router.delete("/:id", verifyAdminHR, (req, res) => {
  Employee.find({ position: req.params.id }, function (err, p) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      if (p.length == 0) {
        Position.findByIdAndRemove(req.params.id, function (
          err,
          position
        ) {
          if (!err) {
            res.send("position has been deleted!");
          } else {
            res.status(403).send(err);
          }
        });
        console.log("delete");
        console.log(req.params.id);
      } else {
        res
          .status(403)
          .send(
            "This Position is associated with Employee so you can not delete this"
          );
      }
    }
  });
});

module.exports = router