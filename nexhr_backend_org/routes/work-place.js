const express = require('express');
const router = express.Router();
const { WorkPlace, WorkPlaceValidation } = require('../models/WorkPlaceModel');
const { verifyAdminHR } = require('../auth/authMiddleware');

router.get("/", verifyAdminHR, async (req, res) => {
  try {
    const workPlaces = await WorkPlace.find().populate("employees", "FirstName LastName").exec();
    if (workPlaces.length > 0) {
      return res.send(workPlaces);
    } else {
      return res.status(200).send([])
    }
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
})

router.get("/:id", verifyAdminHR, async (req, res) => {
  try {
    const workPlace = await WorkPlace.findById(req.params.id);
    if (!workPlace) {
      return res.status(404).send({ message: "No work place found!" });
    }
    res.send(workPlace);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


router.post("/", verifyAdminHR, async (req, res) => {
  try {
    // check is already exists
    if (await WorkPlace.exists({ CompanyName: req.body.CompanyName })) {
      return res.status(400).send({ error: `${req.body.CompanyName} workplace is already exists` })
    }
    //validation workplace data
    const { error } = WorkPlaceValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    } else {
      const workPlace = await WorkPlace.create(req.body);
      return res.send({ message: `${req.body.CompanyName} workplace has been created successfully`, workPlace })
    }
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    const { error } = WorkPlaceValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    } else {
      const updatedData = await WorkPlace.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.send({ message: `${updatedData.CompanyName} workplace has been updated successfully` })
    }
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    const { employees } = await WorkPlace.findById(req.params.id);
    if (employees.length > 0) {
      return res.status(400).send({ error: `${employees.length} employees using this workplace, Please remove them to delete` })
    }
    const deleteData = await WorkPlace.findByIdAndDelete(req.params.id);
    return res.send({ message: `${deleteData.CompanyName} workplace has been delete successfully` })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

module.exports = router;