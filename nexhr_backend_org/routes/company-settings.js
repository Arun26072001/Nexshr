const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { CompanySettings, CompanySettingsValidation } = require('../models/SettingsModel');
const { verifyAdminHR } = require('../auth/authMiddleware');


router.get("/", verifyAdminHR, async (req, res) => {
  try {
    const settings = await CompanySettings.findOne({}).exec();
    return res.send(settings)
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, CompanySettingsValidation, async (err, result) => {
    if (err) {
      res.sendStatus(404)
    } else {
      if (await CompanySettings.exists({ CompanyName: req.body.CompanyName })) {
        return res.status(400).send({ error: "Company settings already exists" })
      }
      const newCompanySettings = req.body;
      CompanySettings.create(newCompanySettings, (err, data) => {
        if (err) {
          res.status(500).send({
            "error": "settings data is not like the schema"
          })
        } else {
          res.send("Company settings has been added!");
        }
      })
    }
  })
})

module.exports = router;