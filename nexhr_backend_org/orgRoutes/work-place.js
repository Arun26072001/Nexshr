const express = require('express');
const router = express.Router();
const Joi = require('joi');
const jwt = require("jsonwebtoken");
const { verifyHR, verifyAdminHR } = require('../auth/authMiddleware');
const { getWorkPlaceModel, WorkPlaceValidation } = require('../OrgModels/OrgWorkPlaceModel');

router.get("/", verifyAdminHR, async (req, res) => {
  try {
    const {orgName} = jwt.decode(req.headers['authorization']);
    const OrgWorkPlace = getWorkPlaceModel(orgName);
    const workPlaces = await OrgWorkPlace.find().populate("country").exec();
    if (!workPlaces) {
      res.status(204).send({ message: "Work place data not found!" })
    }
    res.send(workPlaces);
  } catch (err) {
    res.status(500).send({ message: "Internal server error", details: err.message })
  }
})

router.get("/:id", verifyAdminHR, async (req, res) => {
  try {
    const {orgName} = jwt.decode(req.headers['authorization']);
    const OrgWorkPlace = getWorkPlaceModel(orgName);
    const workPlace = await OrgWorkPlace.findById(req.params.id)
      .populate("Country")
      .populate("State")
      .exec();

    if (!workPlace) {
      return res.status(204).send({ message: "No work place found!" });
    }

    res.send(workPlace);
  } catch (err) {
    res.status(500).send({ message: "Internal server error", details: err.message });
  }
});


router.post("/", verifyAdminHR, async (req, res) => {
  await Joi.validate(req.body, WorkPlaceValidation, (err, result) => {
    if (err) {
      console.log(err.details);
      return res.status(400).send({ message: "Validation error", details: err.details });
    } else {
      const newWorkPlace = req.body;
      const {orgName} = jwt.decode(req.headers['authorization']);
      const OrgWorkPlace = getWorkPlaceModel(orgName);
      OrgWorkPlace.create(newWorkPlace, (err, data) => {
        if (err) {
          console.log(err);
          return res.status(500).send({ message: "Error", deatils: err.deatils });
        } else {
          return res.status(201).send({ message: "New Work Place Saved!" });
        }
      });
    }
  });
});

router.put("/:id", verifyAdminHR, (req, res) => {
  const {orgName} = jwt.decode(req.headers['authorization']);
  const OrgWorkPlace = getWorkPlaceModel(orgName);
  OrgWorkPlace.findByIdAndUpdate(req.params.id, {
    $set: req.body
  }, (err, data) => {
    if (err) {
      res.status(403).send("validation error")
    } else {
      res.send("work place has been updated!")
    }
  })
})

router.delete("/:id", verifyHR, (req, res) => {
  const {orgName} = jwt.decode(req.headers['authorization']);
  const OrgWorkPlace = getWorkPlaceModel(orgName);
  OrgWorkPlace.findOneAndDelete(req.params.id, (err, result) => {
    if (err) {
      res.status(403).send(`${req.params.id} not found`)
    } else {
      res.send("working place has been deleted successfully!")
    }
  })
})

module.exports = router;