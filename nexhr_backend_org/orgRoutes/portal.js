const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { verifyAdmin } = require('../auth/authMiddleware');
const { getOrgPortalModel } = require('../OrgModels/OrgPortalModel');
const { getProjectModel } = require('../OrgModels/OrgProjectModel');

router.get("/", verifyAdmin, (req, res) => {
  const { orgName } = jwt.decode(req.headers['authorization']);
  const OrgPortal = getOrgPortalModel(orgName)
  OrgPortal.find()
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
      const { orgName } = jwt.decode(req.headers['authorization']);
      const OrgPortal = getOrgPortalModel(orgName)
      OrgPortal.create(newPortal, function (err, portalData) {
        if (err) {
          res.status(500).send({ error: err.message });
        } else {
          res.send({ message: "new Portal Saved", portal: portalData });
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
      const { orgName } = jwt.decode(req.headers['authorization']);
      const OrgPortal =  getOrgPortalModel(orgName)
      OrgPortal.findByIdAndUpdate(req.params.id, updatePortal, function (
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
  const { orgName } = jwt.decode(req.headers['authorization']);
  const OrgPortal =  getOrgPortalModel(orgName);
  OrgPortal.findByIdAndRemove({ _id: req.params.id }, function (err, portal) {
    if (!err) {
      console.log("portal deleted");
      res.send(portal);
      const OrgProject = getProjectModel(orgName);
      OrgProject.deleteMany({ portals: { _id: portal._id } }, function (err) {
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