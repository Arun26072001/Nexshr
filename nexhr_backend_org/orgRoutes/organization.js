const express = require("express");
const { Org } = require("../OrgModels/OrganizationModel");
const router = express.Router();
const nodemailer = require("nodemailer");
// const { verifySuperAdmin } = require("../auth/authMiddleware");
const { UserAccount } = require("../OrgModels/UserAccountModel");
const { getEmployeeModel } = require("../OrgModels/OrgEmpModel");
const { getClockinModel } = require("../OrgModels/OrgClockinsModel");
const { getDepartmentModel } = require("../OrgModels/OrgDepartmentModel");
const { getPositionModel } = require("../OrgModels/OrgPositionModel");
const { getPageAuthModel } = require("../OrgModels/OrgPageAuthModel");
const { getUserPermissionModel } = require("../OrgModels/OrgUserPermissionModel");
const { getPayslipModel } = require("../OrgModels/OrgPayslipModel");
const { getTimePatternModel } = require("../OrgModels/OrgTimePatternModel");
const { getProjectModel } = require("../OrgModels/OrgProjectModel");
const { getPayslipInfoModel } = require("../OrgModels/OrgPayslipInfo");
const { getWorkExpModel } = require("../OrgModels/OrgWorkExpModel");
const { getWorkPlaceModel } = require("../OrgModels/OrgWorkPlaceModel");
const { getTeamModel } = require("../OrgModels/OrgTeamModel");
const { getOrganizationSettingsModel } = require("../OrgModels/OrgSettingsModel");
const { getOrgPortalModel } = require("../OrgModels/OrgPortalModel");
const { getLeaveApplicationModel } = require("../OrgModels/OrgLeaveApplicationModel");
const { getRoleAndPermissionModel } = require("../OrgModels/OrgRoleAndPermissionModel");

function createCollections(orgName) {
    // List of models with associated creation functions
    const collectionsWithModel = [
        getOrganizationSettingsModel,
        getClockinModel,
        getDepartmentModel,
        getEmployeeModel,
        getLeaveApplicationModel,
        getPageAuthModel,
        getPayslipInfoModel,
        getPayslipModel,
        getOrgPortalModel,
        getPositionModel,
        getProjectModel,
        getRoleAndPermissionModel,
        getTeamModel,
        getTimePatternModel,
        getUserPermissionModel,
        getWorkExpModel,
        getWorkPlaceModel,
    ];


    // Create and store models dynamically
    const models = {};
    collectionsWithModel.forEach((createModel) => {
        models[orgName] = createModel(orgName);
    });

    return models;
}

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

        createCollections(orgData.orgName);
        const newEmp = {
            Email: req.body.Email,
            FirstName: req.body.FirstName,
            LastName: req.body.LastName,
            Password: req.body.Password,
            Account: 1,
            orgs: [orgData._id]
        };

        const OrgEmployeeModel = getEmployeeModel(orgData.orgName);
        const addEmp = await OrgEmployeeModel.create(newEmp);
        // send email add employee
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>NexsHR</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
            .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; padding: 20px; }
            .header img { max-width: 100px; }
            .content { margin: 20px 0; }
            .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff !important; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${orgData.orgImg}" alt="Logo" />
              <h1>Welcome to ${orgData.orgName}</h1>
            </div>
            <div class="content">
              <p>Hey ${addEmp.FirstName} ${addEmp.LastName} 👋,</p>
              <p><b>Your credentials</b></p><br />
              <p><b>Email</b>: ${addEmp.Email}</p><br />
              <p><b>Password</b>: ${addEmp.Password}</p><br />
              <p>This is the Admin credentials for ${orgData.orgName}, Please Login below Link.</p>
              <a href="${process.env.FRONTEND_URL}/${orgData._id}" class="button">Confirm Email</a>
            </div>
            <div class="footer">
              <p>Have questions? Need help? <a href="mailto:${userAccountData.email}">Contact our support team</a>.</p>
            </div>
          </div>
        </body>
        </html>`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.FROM_MAIL,
                pass: process.env.MAILPASSWORD,
            },
        });

        await transporter.sendMail({
            from: userAccountData.email,
            to: addEmp.Email,
            subject: `Welcome to ${orgData.orgName}`,
            html: htmlContent,
        });

        res.send({ message: `${orgData.orgName} has been saved and ${addEmp.FirstName} has been added` });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});


module.exports = router;