const express = require('express');
const router = express.Router();
const { TimePattern, TimePatternValidation } = require('../models/TimePatternModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');


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
    const addPattern = await TimePattern.create(req.body);
    return res.send({ message: `${req.body.PatternName} pattern has been added successfully`, pattern: addPattern })

  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.put("/:id", verifyAdminHR, (req, res) => {
  TimePattern.findByIdAndUpdate(req.params.id, {
    $set: {
      PatternName: req.body.PatternName
    }
  }, (err, updatedDT) => {
    if (err) {
      res.status(403).send("pattern not found")
    } else {
      res.send("WTP has been updated!")
    }
  })
})

router.delete("/:id", verifyAdminHR, (req, res) => {
  TimePattern.findByIdAndDelete(req.params.id, (err, result) => {
    if (err) {
      res.status(403).send("not found!")
    } else {
      res.send("WTP Deleted successfully!")
    }
  })
})

module.exports = router;