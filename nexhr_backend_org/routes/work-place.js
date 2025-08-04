const express = require('express');
const router = express.Router();
const { WorkPlace, WorkPlaceValidation } = require('../models/WorkPlaceModel');
const { verifyAdminHR } = require('../auth/authMiddleware');
const { errorCollector, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

router.get("/", verifyAdminHR, async (req, res) => {
  try {
    // get company ID from token
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }
    const workPlaces = await WorkPlace.find({ isDeleted: false, company: companyId }).populate("employees", "FirstName LastName").exec();
    if (workPlaces.length > 0) {
      return res.send(workPlaces);
    } else {
      return res.status(200).send([])
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: error.message })
  }
})

router.get("/:id", verifyAdminHR, async (req, res) => {
  try {
    if (!checkValidObjId(req.params.id)) {
      return res.status(400).send({ error: "Invalid WorkPlace ID" });
    }
    const workPlace = await WorkPlace.findById(req.params.id);
    if (!workPlace) {
      return res.status(404).send({ message: "No work place found!" });
    }
    res.send(workPlace);
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: err.message });
  }
});


router.post("/", verifyAdminHR, async (req, res) => {
  try {
    //validation workplace data
    const { error } = WorkPlaceValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    // check is already exists
    if (await WorkPlace.exists({ company: companyId, name: new RegExp(`${req.body.name}`, "i") })) {
      return res.status(400).send({ error: `${req.body.name} workplace is already exists` })
    }
    const workPlace = await WorkPlace.create({ ...req.body, company: comanyId });
    return res.send({ message: `${req.body.name} workplace has been created successfully`, workPlace })

  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    if (!checkValidObjId(req.params.id)) {
      return res.status(400).send({ error: "Invalid WorkPlace ID" });
    }
    const { error } = WorkPlaceValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    } else {
      const updatedData = await WorkPlace.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.send({ message: `${updatedData.CompanyName} workplace has been updated successfully` })
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    if (!checkValidObjId(req.params.id)) {
      return res.status(400).send({ error: "Invalid workPlace ID" });
    }
    const workplace = await WorkPlace.findById(req.params.id);
    if (!workplace) {
      return res.status(400).send({ error: "Workplace not found. Please refresh the page and try again." })
    }
    const employees = workplace.employees || []
    if (employees.length > 0) {
      return res.status(400).send({ error: `${employees.length} employees using this workplace, Please change them to delete` })
    }
    workplace.isDeleted = true;
    await workplace.save();
    return res.send({ message: `${deleteData.name} workplace has been delete successfully` })
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
})

module.exports = router;