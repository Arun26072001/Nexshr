const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { LeaveType, LeaveTypeValidation } = require('../models/LeaveTypeModel');

router.post("/", (req, res)=>{
    Joi.validate(req.body, LeaveTypeValidation ,(err, ok)=>{
        if(err) {
            res.status(403).send("Data not valid!")
        }else{ 
            LeaveType.create(req.body, (err, result)=>{
                if(err) {
                    res.status(500).send("check Schema model data's type!")
                }else{
                    res.send({
                        "status": "ok",
                        "response": "Added"
                    })
                }
            })
        }
    })
})

module.exports = router;