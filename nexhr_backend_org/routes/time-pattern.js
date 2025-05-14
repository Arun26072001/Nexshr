const express = require('express');
const router = express.Router();
const { TimePattern, TimePatternValidation } = require('../models/TimePatternModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');


router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
  TimePattern.find()
    .exec((err, pattern) => {
      if (err) {
        res.status(403).send({
          "message": "Time patterns not found!"
        })
      }
      else {
        res.send(pattern)
      }
    })
})

router.post("/", verifyAdminHR, async (req, res) => {
  try {
    // verify already exists
    if (await TimePattern.exists({ PatternName: req.body.PatternName })) {
      return res.status(400).send({ error: `${req.body.PatternName} pattern is already exists` })
    }
    const { error } = TimePatternValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    if (Number(req.body.StartingTime) > Number(req.body.FinishingTime)) {
      return res.status(400).send({ error: "Finishing time must be later than starting time." });
    }
    const addPattern = await TimePattern.create(req.body);
    return res.send({ message: `${req.body.PatternName} pattern has been added successfully`, pattern: addPattern })

  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    const { error } = TimePatternValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    const updatedPattern = await TimePattern.findByIdAndUpdate(req.params.id, req.body, { new: true })
    return res.send({ message: `${req.body.PatternName} Pattern updated successfully`, updatedPattern })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    const peoplesUsingPattern = await Employee.find({ workingTimePattern: req.params.id }, "workingTimePattern").exec();

    if (peoplesUsingPattern.length > 0) {
      return res.status(400).send({ error: `${peoplesUsingPattern.length} Employees using this pattern. Please change them to delete` })
    }
    const deletePattern = await TimePattern.findByIdAndRemove(req.params.id);
    return res.send({ message: `${deletePattern.PatternName} pattern deleted successfully` })
  } catch (error) {
    console.log("error in delete timePattern", error);
    return res.status(500).send({ error: error.message })
  }
})

module.exports = router;