const express = require('express');
const router = express.Router();
const Joi = require("joi");
const { getProjectModel } = require('../OrgModels/OrgProjectModel');
const { verifyAdmin } = require('../auth/authMiddleware');

router.get("/", verifyAdmin, (req, res) => {
  const { orgName } = jwt.decode(req.headers['authorization']);
  const OrgProject = getProjectModel(orgName)
  OrgProject.find()
    .populate("portals")
    .exec(function (err, project) {
      if (err) {
        console.log(err);
        res.send("err");
      } else {
        res.send(project);
      }
    });
});

router.post("/", verifyAdmin, (req, res) => {
  Joi.validate(req.body, ProjectValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newProject;
      newProject = {
        ProjectTitle: req.body.ProjectTitle,
        ProjectURL: req.body.ProjectURL,
        ProjectDesc: req.body.ProjectDesc,
        portals: req.body.Portal_ID,
        EstimatedTime: req.body.EstimatedTime,
        EstimatedCost: req.body.EstimatedCost,
        ResourceID: req.body.ResourceID,
        Status: req.body.Status,
        Remark: req.body.Remark
      };
      const { orgName } = jwt.decode(req.headers['authorization']);
      const OrgProject = getProjectModel(orgName)
      OrgProject.create(newProject, function (err, project) {
        if (err) {
          console.log(err.message);
          res.send("error");
        } else {
          res.send(project);
          console.log("new project Saved");
        }
      });
      console.log(req.body);
    }
  });
});

router.put("/:id", verifyAdmin, (req, res) => {
  Joi.validate(req.body, ProjectValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let updateProject;
      updateProject = {
        ProjectTitle: req.body.ProjectTitle,
        ProjectURL: req.body.ProjectURL,
        ProjectDesc: req.body.ProjectDesc,
        portals: req.body.Portal_ID,
        EstimatedTime: req.body.EstimatedTime,
        EstimatedCost: req.body.EstimatedCost,
        ResourceID: req.body.ResourceID,
        Status: req.body.Status,
        Remark: req.body.Remark
      };
      const { orgName } = jwt.decode(req.headers['authorization']);
      const OrgProject = getProjectModel(orgName)
      OrgProject.findByIdAndUpdate(req.params.id, updateProject, function (
        err,
        Project
      ) {
        if (err) {
          res.send("error");
        } else {
          res.send(updateProject);
        }
      });
    }
  });
});

router.delete("/:id", verifyAdmin, (req, res) => {
  const { orgName } = jwt.decode(req.headers['authorization']);
  const OrgProject = getProjectModel(orgName)
  OrgProject.findByIdAndRemove({ _id: req.params.id }, function (err, project) {
    if (err) {
      console.log("error");
      res.send("err");
    } else {
      console.log("project deleted");
      res.send(project);
    }
  });
  console.log("delete");
  console.log(req.params.id);
});

module.exports = router;