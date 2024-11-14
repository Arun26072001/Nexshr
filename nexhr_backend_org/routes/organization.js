const express = require("express");
const { Org } = require("../models/OrganizationModel");
const router = express.Router();
const mongoose = require("mongoose");
const { verifySuperAdmin } = require("../auth/authMiddleware");
const { UserAccount } = require("../models/UserAccountModel");
const { getEmployeeModel } = require("./employee");

router.post("/:id", async (req, res) => {
    try {
        // Create a new organization record
        const orgData = await Org.create({
            orgName: req.body.orgName,
            orgImg: req.body.orgImg
        });

        // Find the user account by ID and add the organization ID to its orgs array
        const userAccountData = await UserAccount.findById(req.params.id);
        if (!userAccountData) {
            return res.status(404).send({ error: "User account not found" });
        }

        userAccountData.orgs.push(orgData?._id);
        await userAccountData.save();

        // const newEmp = {
        //     Email: req.body.Email,
        //     FirstName: req.body.FirstName,
        //     IFSCcode: req.body.IFSCcode,
        //     LastName: req.body.LastName,
        //     Password: req.body.Password,
        //     accountHolderName: req.body.accountHolderName,
        //     accountNo: req.body.accountNo,
        //     address: {
        //         city: req.body.city,
        //         state: req.body.state,
        //         country: req.body.country,
        //         zipCode: req.body.zipCode
        //     },
        //     annualLeaveEntitlement: req.body.annualLeaveEntitlement,
        //     annualLeaveYearStart: req.body.annualLeaveYearStart,
        //     bankName: req.body.bankName,
        //     basicSalary: req.body.basicSalary,
        //     company: req.body.company,
        //     companyWorkingHourPerWeek: req.body.companyWorkingHourPerWeek,
        //     dateOfBirth: req.body.dateOfBirth,
        //     dateOfJoining: req.body.dateOfJoining,
        //     department: req.body.department,
        //     description: req.body.description,
        //     employmentType: req.body.employmentType,
        //     entitlement: req.body.entitlement,
        //     fullTimeAnnualLeave: req.body.fullTimeAnnualLeave,
        //     gender: req.body.gender,
        //     managerId: req.body.managerId,
        //     phone: req.body.phone,
        //     position: req.body.position,
        //     publicHoliday: req.body.publicHoliday,
        //     role: req.body.role,
        //     taxDeduction: req.body.taxDeduction,
        //     teamLead: req.body.teamLead,
        //     workingTimePattern: req.body.workingTimePattern
        // };        
        // const OrgEmployeeModel = getEmployeeModel(req.body.orgName);
        // const addEmp = await OrgEmployeeModel.create(newEmp);
        res.send({ message: `Organization has been saved`, orgData });
        // res.send({ message: `Organization has been saved with added ${addEmp?.FirstName} as admin`, orgData });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});


module.exports = router;