const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { WorkPlace, WorkPlaceValidation } = require('../models/WorkPlaceModel');
const { verifyHR, verifyAdminHR } = require('../auth/authMiddleware');


router.get("/", verifyAdminHR, async (req, res) => {
  try {
    const workPlaces = await WorkPlace.find().populate("Country").exec();
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
    const workPlace = await WorkPlace.findById(req.params.id)
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
      WorkPlace.create(newWorkPlace, (err, data) => {
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
  WorkPlace.findByIdAndUpdate(req.params.id, {
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

  WorkPlace.findOneAndDelete(req.params.id, (err, result) => {
    if (err) {
      res.status(403).send(`${req.params.id} not found`)
    } else {
      res.send("working place has been deleted successfully!")
    }
  })
})

module.exports = router;