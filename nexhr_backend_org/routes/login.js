const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Employee } = require('../models/EmpModel');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const { Team } = require('../models/TeamModel');
dotenv.config();

const jwtKey = process.env.ACCCESS_SECRET_KEY;

router.post("/", async (req, res) => {
    try {
        const loginValidation = Joi.object({
            Email: Joi.string().max(200).required(),
            Password: Joi.string().max(100).required()
        });

        const { error } = loginValidation.validate(req.body);
        if (error) {
            console.log("Validation error: " + error);
            return res.status(400).send(error.details[0].message);
        } else {
            const emp = await Employee.findOne({
                Email: { $regex: new RegExp('^' + req.body.Email, 'i') },
                Password: req.body.Password
            }).populate({
                path: "role",
                populate: [
                    { path: "userPermissions" },
                    { path: "pageAuth" }
                ]
            })

            if (!emp) {
                return res.status(400).send({ message: "Invalid Credentials" })
            } else {
                const empDataWithEmailVerified = {
                    ...emp,
                    isVerifyEmail: true,
                    isLogin: true
                };
                // check to emp is team lead
                let isTeamLead = false;
                const teamlead = await Team.findOne({ lead: emp._id });
                if (teamlead) {
                    isTeamLead = true;
                }
                // check to emp is team lead
                let isTeamHead = false;
                const teamhead = await Team.findOne({ head: emp._id });
                if (teamhead) {
                    isTeamHead = true;
                }
                const updateIsEmailVerify = await Employee.findByIdAndUpdate(emp._id, empDataWithEmailVerified, { new: true });
                const empData = {
                    _id: emp._id,
                    Account: emp.Account,
                    profile: emp.profile,
                    FirstName: emp.FirstName,
                    LastName: emp.LastName,
                    annualLeaveEntitlement: emp.annualLeaveEntitlement,
                    roleData: emp?.role,
                    isLogin: updateIsEmailVerify.isLogin,
                    isTeamLead,
                    isTeamHead
                };
                const token = jwt.sign(empData, jwtKey);
                return res.send(token);
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Internal server Error", details: err.message });
    }
});



module.exports = router;
