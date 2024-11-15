const express = require('express');
const router = express.Router();
const Joi = require("joi");
const { verifyHR } = require('../auth/authMiddleware');

router.post("/", verifyHR, (req, res)=>{
    Joi.validate(req.body, AttendanceValidation, (err, result)=>{
        if(err){
            res.status(400).send(err)
        }else{
            Attendance.create(result, (err, data)=>{
                if(err){
                    res.status(500).send("internal error")
                }else {
                    res.status(201).send("attendance has been added!")
                }
            })
        }
    })
})

module.exports = router;