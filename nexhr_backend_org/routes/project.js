const express = require('express');
const router = express.Router();
const {Project, ProjectValidation} = require('../models/ProjectModel'); 
const jwt = require('jsonwebtoken');
const { verifyAdmin } = require('../auth/authMiddleware');
const jwtKey = process.env.ACCCESS_SECRET_KEY;



router.get("/", verifyAdmin, (req, res) => {
    // var employee = {};
  
    Project.find()
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
        let project;
        project = {
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
        Project.create(project, function (err, project) {
          if (err) {
            console.log(err);
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
  
        Project.findByIdAndUpdate(req.params.id, updateProject, function (
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
  
      console.log("put");
      console.log(req.body);
    });
  });
  
  router.delete("/:id", verifyAdmin, (req, res) => {
    Project.findByIdAndRemove({ _id: req.params.id }, function (err, project) {
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