const express = require('express');
const router = express.Router();
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { getEmployeeModel } = require('../OrgModels/OrgEmpModel');
const { Org } = require('../OrgModels/OrganizationModel');

const jwtKey = process.env.ACCCESS_SECRET_KEY;
router.post("/:orgId", async (req, res) => {
    const schema = Joi.object({
        Email: Joi.string().max(200).required(),
        Password: Joi.string().max(100).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        console.log("Validation error: " + error);
        return res.status(400).send(error.details[0].message);
    }

    try {
        const orgData = await Org.findById({ _id: req.params.orgId })

        const { orgName } = orgData;

        const OrgEmployee = getEmployeeModel(orgName);
        const emp = await OrgEmployee.findOne({ Email: req.body.Email.toLowerCase(), Password: req.body.Password })
            .populate({
                path: `role`,
                populate: [
                    { path: `userPermissions` },
                    { path: `pageAuth` }
                ]
            })

        if (!emp) {
            return res.status(400).send({ message: "Invalid Credentials" })
        } else {
            // const empDataWithEmailVerified = {
            //     ...emp,
            //     isVerifyEmail: true
            // };

            // const updateIsEmailVerify = await OrgEmployee.findByIdAndUpdate(emp._id, empDataWithEmailVerified, { new: true });
            emp.isVerifyEmail = true;
            await emp.save();
            const empData = {
                _id: emp._id,
                Account: emp.Account,
                FirstName: emp.FirstName,
                LastName: emp.LastName,
                annualLeaveEntitlement: emp.annualLeaveEntitlement,
                roleData: emp?.role[0],
                // orgId: req.params.orgId,
                // orgName: orgName
            };

            const token = jwt.sign(empData, jwtKey);
            return res.send(token);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Internal server Error", details: err.message });
    }
});



module.exports = router;
