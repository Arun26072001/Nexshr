const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { applicationSettings, applicationSettingsValidation, applicationSettingsSchema } = require("../models/ApplicationSettingsModel")
const {verifyHR} = require("../auth/authMiddleware")

// const appSettingsModels = {};

// function getAppSettingsModel(orgName) {
//   // If model already exists in the object, return it; otherwise, create it
//   if (!appSettingsModels[orgName]) {
//     appSettingsModels[orgName] = mongoose.model(`${orgName}AppSettings`, applicationSettingsSchema);
//   }
//   return appSettingsModels[orgName];
// }

router.post("/", verifyHR, (req, res) => {
    Joi.validate(req.body,applicationSettingsValidation, (err, result) => {
        if (err) {
            res.status(400).send("bad request!")
        } else {
            // const {orgName} = jwt.decode(req.headers['authorization']);
            // const applicationSettings = getAppSettingsModel(orgName);
            applicationSettings.create(result, (err, data)=>{
                if(err){
                    res.status(500).send("internal error");
                }else {
                    res.status(201).send("settings has been added!")
                }
            })
        }
    })
})


module.exports = router; 