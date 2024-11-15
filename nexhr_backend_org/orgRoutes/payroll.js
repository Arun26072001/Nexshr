const express = require('express');
const { verifyHR } = require('../auth/authMiddleware');
const router = express.Router();
const Joi = require('joi');
const { Employee } = require('../models/EmpModel');
const { PayrollValidation, Payroll } = require('../models/PayrollModel');


router.post("/:id", verifyHR, (req, res) => {
    Joi.validate(req.body, PayrollValidation, (err, result) => {
        if (err) {
            res.status(400).send("Invalid data");
        } else {
            Employee.findById(req.params.id, (err, emp) => {
                if (!emp) {
                    res.status(404).send("Employee not found!");
                } else {
                    const newPayroll = req.body;
                    Payroll.create(newPayroll, (err, payroll) => {
                        if (err) {
                            res.status(500).send("Payroll number unique!, Please check data!");
                        } else {
                            emp.payroll.push(payroll._id);  // Assuming payroll is a reference to another model
                            emp.save((err, data) => {
                                if (err) {
                                    console.log(err);
                                    res.status(500).send("Error saving employee data");
                                } else {
                                    res.send("Payroll has been added to Employee!");
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});


module.exports = router;