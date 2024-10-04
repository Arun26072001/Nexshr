const express = require('express');
const router = express.Router();
const {Position, PositionValidation} = require('../models/PositionModel');
const {Employee} = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');

router.get("/", verifyAdminHR, (req, res) => {
    Position.find()
      .populate("company")
      .exec(function (err, positions) {
        if(err) {
          res.status(500).send({Error: err})
        }
        res.send(positions);
      });
  });
  
  router.post("/", verifyAdminHR, (req, res) => {
    Joi.validate(req.body, PositionValidation, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err.details[0].message);
      } else {
        let newPosition;
  
        newPosition = {
          PositionName: req.body.PositionName,
          company: req.body.CompanyID
        };
  
        Position.create(newPosition, function (err, position) {
          if (err) {
            res.status(500).send({Error: err});
          } else {
            res.send("new Position Added!");
            // console.log("new Role Saved");
          }
        });
      }
      // console.log(req.body);
    });
  });
  router.put("/:id", verifyAdminHR, (req, res) => {
    Joi.validate(req.body, PositionValidation, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err.details[0].message);
      } else {
        let updatePosition;
  
        updatePosition = {
          PositionName: req.body.PositionName,
          CompanyID: req.body.CompanyID
        };
  
        Position.findByIdAndUpdate(req.params.id, updatePosition, function (
          err,
          position
        ) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.send("position has been updated! "+position.PositionName);
          }
        });
      }
    });
  });
  
  router.delete("/:id", verifyAdminHR, (req, res) => {
    Employee.find({ position: req.params.id }, function (err, p) {
      if (err) {
        console.log(err);
        res.send(err);
      } else {
        if (p.length == 0) {
          Position.findByIdAndRemove(req.params.id, function (
            err,
            position
          ) {
            if (!err) {
              res.send("position has been deleted!");
            } else {
              res.status(403).send(err);
            }
          });
          console.log("delete");
          console.log(req.params.id);
        } else {
          res
            .status(403)
            .send(
              "This Position is associated with Employee so you can not delete this"
            );
        }
      }
    });
  });

  module.exports = router