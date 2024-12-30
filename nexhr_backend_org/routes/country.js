const express = require('express');
const router = express.Router();
const { Country, CountryValidation } = require('../models/CountryModel');
const { State } = require('../models/StateModel');
const { City } = require('../models/CityModel');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { verifyHR, verifyAdminHR, verifyAdminHREmployee } = require('../auth/authMiddleware');
const jwtKey = process.env.ACCCESS_SECRET_KEY;


router.get("/", verifyAdminHREmployee, (req, res) => {
  Country.find()
    .exec(function (err, country) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(country);
      }
    });
});

router.get("/:name", verifyAdminHREmployee, async (req, res) => {
  try {
    const country = await Country.findOne({ CountryName: req.params.name })
      .populate("states")
      .exec();

    if (!country) {
      return res.status(404).send({ message: "Country not found" });
    }
    res.send(country);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred", error: err });
  }
});


router.post("/", verifyHR, (req, res) => {
  Joi.validate(req.body, CountryValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newCountry;

      newCountry = {
        CountryName: req.body.CountryName
      };

      Country.create(newCountry, function (err, country) {
        if (err) {
          res.status(500).send(err, "check url and data");
        } else {
          res.send("New country has been added!");
          // console.log("new country Saved");
        }
      });
      console.log(req.body);
    }
  });
});

router.put("/:id", verifyHR, (req, res) => {
  Joi.validate(req.body, CountryValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err.details[0].message);
    } else {
      let newCountry;

      newCountry = {
        CountryName: req.body.CountryName
      };
      Country.findByIdAndUpdate(req.params.id, {
        $set: newCountry
      }, function (
        err,
        country
      ) {
        if (err) {
          res.status(500).send("check url and data");
        } else {
          res.send("country has been updated!");
        }
      });
    }

    console.log("put");
    console.log(req.body);
  });
});

router.delete("/:id", verifyHR, (req, res) => {
  Country.findById(req.params.id, function (err, foundCountry) {
    if (err) {
      res.send(err);
    } else {
      console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", foundCountry);
      if (!foundCountry.states.length == 0) {
        res
          .status(403)
          .send(
            "First Delete All The states in this country before deleting this country"
          );
      } else {
        Country.findByIdAndRemove({ _id: req.params.id }, function (
          err,
          country
        ) {
          if (!err) {
            State.deleteMany({ CountryID: { _id: req.params.id } }, function (
              err
            ) {
              if (err) {
                console.log(err);
                res.send("error");
              } else {
                City.deleteMany(
                  { state: { CountryID: { _id: req.params.id } } },
                  function (err) {
                    if (err) {
                      console.log(err);
                      res.send("error");
                    } else {
                      res.send("Country has been deleted!");
                    }
                  }
                );
              }
            });
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