const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { applicationSettings, applicationSettingsValidation } = require("../models/ApplicationSettingsModel")
const {verifyHR} = require("../auth/authMiddleware")

router.post("/", verifyHR, (req, res) => {
    Joi.validate(req.body,applicationSettingsValidation, (err, result) => {
        if (err) {
            res.status(400).send("bad request!")
        } else {
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