const express = require('express');
const router = express.Router();
const { State, StateValidation } = require('../models/StateModel');
const { Country } = require('../models/CountryModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');

router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
  State.find()
    .exec(function (err, state) {
      if (err) {
        res.status(500).send(err, "check url");
      }
      res.send(state);
    });
});

  router.get("/:name", verifyAdminHREmployeeManagerNetwork, (req, res) => {
    State.findOne({StateName: req.params.name})
      .populate("cities")
      .exec((err, stateData) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(stateData);
        }
      });
  });

//State
router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, StateValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newState;

      newState = {
        StateName: req.body.StateName,
        country: req.body.CountryID
      };

      State.create(newState, function (err, state) {
        if (err) {
          res.status(500).send(err, "check url and data");
        } else {
          Country.findById(req.body.CountryID, function (err, country) {
            if (err) {
              console.log(err);
              res.send("err");
            } else {
              console.log(state);
              console.log(country);
              country.states.push(state);
              country.save(function (err, data) {
                if (err) {
                  console.log(err);
                  res.send("err");
                } else {
                  res.send("state has been added in given country")
                }
              });
            }
          });
        }
      });
      console.log(req.body);
    }
  });
});
//State
//state
router.put("/:id", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, StateValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newState;

      newState = {
        StateName: req.body.StateName,
        country: req.body.CountryID
      };

      State.findByIdAndUpdate(req.params.id, newState, function (err, state) {
        if (err) {
          res.status(500).send(err, "check url");
        } else {
          res.send("State has been updated!");
        }
      });
    }
  });
});

router.delete("/:id", verifyAdminHR, (req, res) => {
  State.findById(req.params.id, function (err, foundState) {
    if (err) {
      res.send(err);
    } else {
      // console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", foundCountry);
      if (!foundState.cities.length == 0) {
        res
          .status(403)
          .send(
            "First Delete All The cities in this state before deleting this state"
          );
      } else {
        State.findByIdAndRemove(req.params.id, function (err, state) {
          if (!err) {
            Country.update(
              { _id: state.country[0] },
              { $pull: { states: state._id } },
              function (err, numberAffected) {
                if (err) {
                  console.log(err);
                }
                res.send("state has been delete. Affected: ", numberAffected.data);
              }
            );
          } else {
            console.log(err);
            res.send("error");
          }
        });
      }
    }
  });
});

module.exports = router;