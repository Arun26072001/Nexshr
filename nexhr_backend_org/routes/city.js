const express = require('express');
const router = express.Router();
const {State} = require('../models/StateModel');
const {City, CityValidation} = require('../models/CityModel');
const {Company} = require('../models/CompanyModel');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { verifyHR } = require('../auth/authMiddleware');

const jwtKey = process.env.ACCCESS_SECRET_KEY;

  router.get("/", verifyHR, (req, res) => {
    City.find()
      .populate({ path: "state", populate: { path: "country" } })
      .exec(function (err, city) {
        if(err) {
          res.status(500).send("check url")
        }
        res.send(city);
      });
  });

  router.post("/", verifyHR,(req, res) => {
    Joi.validate(req.body, CityValidation, (err, result) => {
      if (err) {
        res.status(400).send(err.details[0].message);
      } else {
        let newCity;
  
        newCity = {
          CityName: req.body.CityName,
          state: req.body.StateID
        };

        // let token = jwt.sign(newCity,jwt_token)
  
        City.create(newCity, function (err, city) {
          if (err) {
            res.send("error: ", err);
          } else {
            State.findById(req.body.StateID, function (err, state) {
              if (err) {
                console.log(err);
                res.send("err");
              } else {
                state.cities.push(city);
                state.save(function (err, data) {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err, "check url and data");
                  } else {
                    console.log(data);
                    res.send("city has been added!");
                  }
                });
              }
            });
  
            console.log("new city Saved");
          }
        });
        console.log(req.body);
      }
    });
  });
  router.put("/:id", verifyHR, (req, res) => {
    Joi.validate(req.body, CityValidation, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err.details[0].message);
      } else {
        let newCity;
  
        newCity = {
          CityName: req.body.CityName,
          state: req.body.StateID
        };
  
        City.findByIdAndUpdate(req.params.id, newCity, function (err, city) {
          if (err) {
            res.status(403).send(err);
          } else {
            res.send("City has been updated as "+city.CityName);
          }
        });
      }
    });
  });
  
  router.delete("/:id", verifyHR, (req, res) => {
    Company.find({ city: req.params.id }, function (err, country) {
      if (err) {
        console.log(err);
        res.send(err);
      } else {
        console.log(country.length == 0);
        if (country.length == 0) {
          City.findByIdAndRemove({ _id: req.params.id }, function (err, city) {
            if (!err) {
              console.log(" state deleted");
              State.update(
                { _id: city.state[0] },
                { $pull: { cities: city._id } },
                function (err, numberAffected) {
                  console.log(numberAffected);
                  res.send("city has been delete!");
                }
              );
            } else {
              console.log(err);
              res.send("error");
            }
          });
        } else {
          res
            .status(403)
            .send(
              "This city is associated with company so you can not delete this"
            );
        }
      }
    });
  
    console.log("delete");
    console.log(req.params.id);
  });



module.exports = router;