const express = require('express');
const router = express.Router();
const {Portal, PortalValidation} = require('../models/PortalModel');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const dotenv = require('dotenv');
const { verifyAdmin } = require('../auth/authMiddleware');
dotenv.config()

const jwtKey = process.env.ACCCESS_SECRET_KEY;


router.get("/", verifyAdmin, (req, res) => {
    Portal.find()
      .populate({ path: "projects" })
      .exec(function (err, portalData) {
        if (err) {
          res.send("err");
          console.log(err);
        }
        res.send(portalData);
      });
  });
  
  router.post("/", verifyAdmin, (req, res) => {
    Joi.validate(req.body, PortalValidation, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err.details[0].message);
      } else {
        let newPortal;
        newPortal = {
          PortalName: req.body.PortalName,
          Status: req.body.Status
        };
  
        Portal.create(newPortal, function (err, portalData) {
          if (err) {
            res.send("Error: "+err);
          } else {
            res.send("new Portal Saved");
          }
        });
      }
    });
  });
  
  router.put("/:id", verifyAdmin, (req, res) => {
    Joi.validate(req.body, PortalValidation, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err.details[0].message);
      } else {
        let updatePortal;
        updatePortal = {
          PortalName: req.body.PortalName,
          Status: req.body.Status
        };
        Portal.findByIdAndUpdate(req.params.id, updatePortal, function (
          err,
          Portal
        ) {
          if (err) {
            res.send(err);
          } else {
            res.send("portal has been updated!", Portal.PortalName);
          }
        });
      }
    });
  });
  
  router.delete("/:id", verifyAdmin, (req, res) => {
    Portal.findByIdAndRemove({ _id: req.params.id }, function (err, portal) {
      if (!err) {
        console.log("portal deleted");
        res.send(portal);
        Project.deleteMany({ portals: { _id: portal._id } }, function (err) {
          if (err) {
            res.send("error");
            console.log(err);
          }
        });
        console.log("new Portal Saved");
      } else {
        console.log("error");
        res.send("err");
      }
    });
    console.log("delete");
    console.log(req.params.id);
  });

  module.exports = router;