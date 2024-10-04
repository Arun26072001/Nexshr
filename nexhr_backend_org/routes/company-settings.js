const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { CompanySettings, CompanySettingsValidation } = require('../models/SettingsModel');
const jwt = require("jsonwebtoken");
const { verifyHR } = require('../auth/authMiddleware');

const jwtKey = process.env.ACCCESS_SECRET_KEY;


router.post("/",verifyHR, (req, res)=>{
    Joi.validate(req.body, CompanySettingsValidation, (err, result)=>{
      if(err) {
        res.sendStatus(404)
      }else{
        console.log("verified: ",result);
        const newCompanySettings = req.body;
        CompanySettings.create(newCompanySettings, (err, data)=>{
          if(err) {
            res.status(500).send({
              "error": "settings data is not like the schema"
            })
          }else{
            res.send("Company settings has been added!");
          }
        }) 
      }
    })
})

module.exports = router;