const express = require('express');
const router = express.Router();
const Joi = require('joi');
const jwt = require("jsonwebtoken");
const { verifyHR } = require('../auth/authMiddleware');
const { getOrganizationSettingsModel } = require('../OrgModels/OrgSettingsModel');


router.post("/",verifyHR, (req, res)=>{
    Joi.validate(req.body, CompanySettingsValidation, (err, result)=>{
      if(err) {
        res.sendStatus(404)
      }else{
        const newCompanySettings = req.body;
        const {orgName} = jwt.decode(req.headers['authorization']);
        const OrgSettings = getOrganizationSettingsModel(orgName)
        OrgSettings.create(newCompanySettings, (err, data)=>{
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