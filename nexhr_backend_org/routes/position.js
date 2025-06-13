const express = require('express');
const router = express.Router();
const { Position, PositionValidation } = require('../models/PositionModel');
const { Employee } = require('../models/EmpModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');

router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
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

router.post("/", verifyAdminHR, async (req, res) => {
  try {
    const { error } = PositionValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }

    const existing = await Position.findOne({ PositionName: req.body.PositionName });
    if (existing) {
      return res.status(400).send({
        error: `${req.body.PositionName} Position already exists`,
      });
    }

    const position = await Position.create(req.body);

    res.send({ message: `${position.PositionName} Position added!` });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    const updatedPosition = {
      PositionName: req.body.PositionName,
      company: req.body.company,
    };

    const { error } = PositionValidation.validate(updatedPosition);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }

    const position = await Position.findByIdAndUpdate(
      req.params.id,
      updatedPosition,
      { new: true }
    );

    if (!position) {
      return res.status(404).send({ message: "Position not found." });
    }

    res.send({ message: `Position has been updated! ${position.PositionName}` });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
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