const express = require('express');
const router = express.Router();
const {TimePattern, TimePatternValidation} = require('../models/TimePatternModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployee } = require('../auth/authMiddleware');


router.get("/", verifyAdminHREmployee, (req, res)=>{
    TimePattern.find()
    .exec((err, pattern)=>{
        if(err) {
          res.status(403).send({
            "message": "Time patterns not found!"
          })
        }
        else{
            res.send(pattern)
        }
    })
})

router.post("/", verifyAdminHR, (req, res)=>{
  // console.log("46: "+req.body);
    Joi.validate(req.body, TimePatternValidation, (err, result)=>{
        if(err) {
          res.status(400)
            res.json({
              "status": 400 
            });
        }else {
            console.log("53: "+result);
            let newTimepattern = req.body;

            TimePattern.create(newTimepattern, (err, data)=>{
                if(err) {
                  res.status(500).send("invalid data!")
                }
                else{
                    res.send("Time pattern added");
                }
            })
        }
    })
})

router.put("/:id", verifyAdminHR, (req, res)=>{
  TimePattern.findByIdAndUpdate(req.params.id, {
    $set: {
      PatternName: req.body.PatternName
    }
  }, (err, updatedDT)=>{
    if(err) {
      res.status(403).send("pattern not found")
    }else {
      res.send("WTP has been updated!")
    }
  })
})

router.delete("/:id", verifyAdminHR, (req, res) =>{
  TimePattern.findByIdAndDelete(req.params.id, (err, result)=>{
    if(err) {
      res.status(403).send("not found!")
    }else {
      res.send("WTP Deleted successfully!")
    }
  })
})

module.exports = router;