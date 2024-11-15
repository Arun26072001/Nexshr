const express = require('express');
const router = express.Router();
const {Salary, SalaryValidation} = require('../models/SalaryModel');
const {Employee} = require('../models/EmpModel')
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { verifyHR } = require('../auth/authMiddleware');

const jwtKey = process.env.ACCCESS_SECRET_KEY;

router.get("/", verifyHR, (req, res) => {
    // var employee = {};
    // {path: 'projects', populate: {path: 'portals'}}
    Employee.find()
      // .populate({ path: "city", populate: { path: "state" } ,populate: { populate: { path: "country" } } })
      .populate("salary")
      // .select(" -role -position -department")
      // .select("FirstName LastName MiddleName")
      .exec(function (err, emp) {
        if(err) {
          res.status(403).send(err)
        }
        // employee = employees;
        let filteredCompany = emp.filter(data => data["salary"].length == 1);
        res.send(filteredCompany);
      });
  });
  
  router.post("/:id", verifyHR, (req, res) => {
    Joi.validate(req.body, SalaryValidation, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err.details[0].message);
      } else {
        Employee.findById(req.params.id, function (err, employee) {
          if (err) {
            console.log(err);
            res.send("err");
          } else {
            if (employee.salary.length == 0) {
              let newSalary;
  
              newSalary = {
                BasicSalary: req.body.BasicSalary,
                BankName: req.body.BankName,
                AccountNo: req.body.AccountNo,
                AccountHolderName: req.body.AccountHolderName,
                IFSCcode: req.body.IFSCcode,
                TaxDeduction: req.body.TaxDeduction
              };
  
              Salary.create(newSalary, function (err, salary) {
                if (err) {
                  console.log(err);
                  res.send("error");
                } else {
                  employee.salary.push(salary);
                  employee.save(function (err, data) {
                    if (err) {
                      console.log(err);
                      res.send(err);
                    } else {
                      // console.log(data);
                      res.send("salary has been added!");
                    }
                  });
                  console.log("new salary Saved");
                }
              });
              console.log(req.body);
            } else {
              res
                .status(403)
                .send("Salary Information about this employee already exits");
            }
          }
        });
      }
    });
  });
  
  router.put("/:id", verifyHR, (req, res) => {
    Joi.validate(req.body, SalaryValidation, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err.details[0].message);
      } else {
        let newSalary;
  
        newSalary = {
          BasicSalary: req.body.BasicSalary,
          BankName: req.body.BankName,
          AccountNo: req.body.AccountNo,
          AccountHolderName: req.body.AccountHolderName,
          IFSCcode: req.body.IFSCcode,
          TaxDeduction: req.body.TaxDeduction
        };
  
        Salary.findByIdAndUpdate(req.params.id, newSalary, function (err, salary) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.send("salary has been updated!");
          }
        });
      }
  
      console.log("put");
      console.log(req.body);
    });
  });
  
  router.delete("/:id", verifyHR, (req, res) => {
    Employee.findById(req.params.id , function (err, employee) {
      console.log("uuuuuuuunnnnnnnnnnnnnnndef", employee.salary[0]);
      if (err) {
        res.send("error");
        console.log(err);
      } else {
        Salary.findByIdAndRemove(employee.salary[0], function (
          err,
          salary
        ) {
          if (!err) {
            console.log("salary deleted");
            Employee.update(
              { _id: req.params.id },
              { $pull: { salary: employee.salary[0] } },
              function (err, numberAffected) {
                console.log(numberAffected);
                res.send("Salary has been deleted for Employee!");
              }
            );
          } else {
            // console.log(err);
            res.send("Error: ", err);
          }
        });
        console.log("delete");
        console.log(req.params.id);
      }
    });
  });

  module.exports = router;