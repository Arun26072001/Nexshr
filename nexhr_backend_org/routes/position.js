const express = require('express');
const router = express.Router();
const { Position, PositionValidation } = require('../models/PositionModel');
const { Employee } = require('../models/EmpModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { errorCollector, checkValidObjId, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
  const companyId = getCompanyIdFromToken(req.headers["authorization"]);
  if (!companyId) {
    return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
  }
  Position.find({ isDeleted: false, company: companyId })
    .populate("company")
    .exec(function (err, positions) {
      if (err) {
        res.status(500).send({ Error: err })
      }
      res.send(positions);
    });
});

router.post("/", verifyAdminHR, async (req, res) => {
  try {
    const { error } = PositionValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    const companyId = req.body?.company || ""
    const existing = await Position.findOne({ PositionName: { $regex: `${req.body.PositionName}`, $options: `i` }, company: companyId });
    if (existing) {
      return res.status(400).send({
        error: `${req.body.PositionName} Position already exists`,
      });
    }

    const position = await Position.create(req.body);
    res.send({ message: `${position.PositionName} Position added!` });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

router.get("/:id", verifyAdminHR, async (req, res) => {
  try {
    const { id } = req.params;

    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid position ID" });
    }

    const position = await Position.findById(id);
    if (!position) {
      return res.status(404).send({ error: "Position not found" });
    }

    res.send(position);
  } catch (err) {
    await errorCollector({
      url: req.originalUrl,
      name: err.name,
      message: err.message,
      env: process.env.ENVIRONMENT,
    });
    res.status(500).send({ error: err.message });
  }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    const { id } = req.params;

    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid position ID" });
    }

    const updatedPosition = {
      PositionName: req.body.PositionName?.trim(),
      company: req.body.company,
    };

    const { error } = PositionValidation.validate(updatedPosition);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const position = await Position.findByIdAndUpdate(id, updatedPosition, {
      new: true,
      runValidators: true,
    });

    if (!position) {
      return res.status(404).send({ message: "Position not found." });
    }

    res.send({ message: `Position has been updated: ${position.PositionName}` });
  } catch (err) {
    await errorCollector({
      url: req.originalUrl,
      name: err.name,
      message: err.message,
      env: process.env.ENVIRONMENT,
    });
    console.error("Update error:", err);
    res.status(500).send({ error: err.message });
  }
});


router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }

    // Check for valid ObjectId
    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid position ID" });
    }

    // Check if any employee is assigned to this position
    const employeesInPosition = await Employee.find({ position: id, isDeleted: false, company: companyId }).lean();

    if (employeesInPosition.length > 0) {
      return res.status(400).send({
        error: "Employees are currently assigned to this position. Please reassign them before deletion."
      });
    }

    // Soft delete by setting isDeleted: true
    const position = await Position.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!position) {
      return res.status(404).send({ error: "Position not found" });
    }

    return res.send({ message: `${position.PositionName} position has been marked as deleted.` });
  } catch (error) {
    await errorCollector({
      url: req.originalUrl,
      name: error.name,
      message: error.message,
      env: process.env.ENVIRONMENT
    });
    res.status(500).send({ error: error.message });
  }
});


module.exports = router