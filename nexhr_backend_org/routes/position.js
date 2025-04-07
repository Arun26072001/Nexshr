const express = require('express');
const router = express.Router();
const { Position, PositionValidation } = require('../models/PositionModel');
const { Employee } = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');

// router.get("/", verifyAdminHR, (req, res) => {
router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
  // const { orgName } = jwt.decode(req.headers['authorization']);
  // const Position = getPositionModel(orgName)
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
    // .populate("company")
    .exec(function (err, position) {
      if (err) {
        res.status(500).send({ Error: err })
      }
      res.send(position);
    });
});

router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, PositionValidation, async (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {
      if (await Position.exists({ PositionName: req.body.PositionName })) {
        return res.status(400).send({ error: `${req.body.PositionName} Position is already exists` })
      }
      Position.create(req.body, function (err, position) {
        if (err) {
          res.status(500).send({ message: err.message });
        } else {
          res.send({ message: `${position.PositionName} Position Added!` });
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

router.delete("/:id", async (req, res) => {
  try {
    const isEmpInPosition = await Employee.find({ position: req.params.id }).exec();
    if (isEmpInPosition.length > 0) {
      return res.status(400).send({ error: "In this position has some Employee, Please change them to position" })
    } else {
      const deletePos = await Position.findByIdAndRemove({ _id: req.params.id });
      return res.send({ message: `${deletePos.PositionName} Position has been deleted successfully` })
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

module.exports = router