const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');
const { getTimePatternModel } = require('../OrgModels/OrgTimePatternModel');


router.get("/", verifyAdminHR, (req, res) => {
  const { orgName } = jwt.decode(req.headers['authorization']);
  const orgTimePattern = getTimePatternModel(orgName);
  orgTimePattern.find()
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

router.post("/", verifyAdminHR, (req, res) => {
  // console.log("46: "+req.body);
  Joi.validate(req.body, TimePatternValidation, (err, result) => {
    if (err) {
      res.status(400).send({error: err.details[0].message})
    } else {
      let newTimepattern = req.body;
      const { orgName } = jwt.decode(req.headers['authorization']);
      const orgTimePattern = getTimePatternModel(orgName);
      orgTimePattern.create(newTimepattern, (err, data) => {
        if (err) {
          res.status(500).send("invalid data!")
        }
        else {
          res.send("Time pattern added");
        }
      })
    }
  })
})

router.put("/:id", verifyAdminHR, (req, res) => {
  const { orgName } = jwt.decode(req.headers['authorization']);
  const orgTimePattern = getTimePatternModel(orgName);
  orgTimePattern.findByIdAndUpdate(req.params.id, {
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
  const { orgName } = jwt.decode(req.headers['authorization']);
  const orgTimePattern = getTimePatternModel(orgName);
  orgTimePattern.findByIdAndDelete(req.params.id, (err, result) => {
    if (err) {
      res.status(403).send("not found!")
    } else {
      res.send("WTP Deleted successfully!")
    }
  })
})

module.exports = router;