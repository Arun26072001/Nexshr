const express = require("express");
const router = express.Router();
const { verifyAdminHR, verifyEmployee, verifyAdminHREmployeeManagerNetwork, verifyAdminHREmployee, verifyAdminHRTeamHigherAuth, verifyTeamHigherAuthority } = require("../auth/authMiddleware");
const { TeamValidation, Team } = require("../models/TeamModel");
const { Employee } = require("../models/EmpModel");

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const teams = await Team.find()
            .populate({
                path: "employees",
                select: "_id FirstName LastName"
            })
            .populate({
                path: "lead",
                select: "_id FirstName LastName"
            });
        res.send(teams)
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: err.message });
    }
});

router.get("/:who/:id", verifyTeamHigherAuthority, async (req, res) => {
    try {
        const teams = await Team.find({ [req.params.who]: req.params.id })
            .populate({
                path: "employees",
                select: "_id FirstName LastName"
            })
            .populate({
                path: "lead",
                select: "_id FirstName LastName"
            });

        res.send(teams);
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: err.message });
    }
})

router.get("/user", verifyAdminHR, async (req, res) => {
    try {
        const teams = await Team.find()
            .populate({
                path: "employees", // Populate employees field
                select: "_id FirstName LastName", // Select only required fields
            });

        // Format each team and its employees
        const teamData = teams.map((team) => ({
            label: team.teamName, // Set teamName for the team label
            value: team.teamName, // Set teamName for the team value
            children: team.employees.map((employee) => ({
                label: `${employee.FirstName} ${employee.LastName}`, // Full name for employee label
                value: employee.FirstName.toLowerCase(), // First name for employee value
                id: employee._id.toString(), // MongoDB _id as employee id
            })),
        }));

        // Create a "Select All" option that includes all teams and employees
        const selectAllOption = {
            label: 'Select All',
            value: 'select-all',
            children: teamData,
        };

        // Add "Select All" option at the beginning of the response
        const formattedTeams = [selectAllOption, ...teamData];

        // Send the response back with status, status_code, and Team array
        res.status(200).json({
            status: true,
            status_code: 200,
            Team: formattedTeams
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error", details: err.message });
    }
});

router.get("/:id", verifyAdminHRTeamHigherAuth, async (req, res) => {
    try {
        const response = await Team.findById(req.params.id)

        if (!response) {
            res.status(404).send({ message: "team not found" })
        } else {
            res.send(response);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "Error in get a team of Employee", details: err })
    }
})

router.get("/members/:id", verifyEmployee, async (req, res) => {
    try {
        // const {orgName} = jwt.decode(req.headers['authorization']);
        // const Team = getTeamModel(orgName)
        const who = req.params.isLead ? "lead" : "head"
        const response = await Team.findOne({ [who]: req.params.id })
            .populate({
                path: "employees",
                select: "_id FirstName LastName",
                populate: {
                    path: 'teamLead',
                    select: "_id FirstName LastName",
                    populate: {
                        path: "department"
                    }
                }
            })
        if (!response) {
            res.status(404).send({ message: "team not found" })
        } else {
            res.send(response);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error in get a team of Employee", details: err })
    }
})

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        const validation = TeamValidation.validate(req.body);
        const { error } = validation;
        const isTeamName = await Team.find({ teamName: req.body.teamName }).exec();
        if (isTeamName.length > 0) {
            return res.status(400).send({ error: `${isTeamName.teamName} Already exist!` })
        }
        // const isTeamLead = await Team.find({ lead: req.body.lead }).populate("lead","FirstName LastName");
        // if (isTeamLead.length > 0) {
        //     return res.status(400).send({ error: `${isTeamLead.lead.FirstName} already lead in ${isTeamLead.teamName}` })
        // }
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        } else {
            const newTeamData = {
                ...req.body,
                employees: [...req.body.employees, ...req.body.lead, ...req.body.head, ...req.body.manager]
            }
            const newTeam = await Team.create(newTeamData, { new: true });
            const emps = await Employee.find({ _id: req.body.employees }).populate({ path: "company" });
            emps.map(async (emp) => {
                emp.teamLead = req.body.lead
                emp.team = newTeam._id
                await emp.save();
                sendMail({
                    From: process.env.FROM_MAIL,
                    To: emp.Email,
                    Subject: `Welcome to ${newTeam.teamName} Team`,
                    HtmlBody: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emp.company.CompanyName} - Team Invitation</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center;">
      
      <!-- Header -->
      <div style="padding-bottom: 15px;">
        <h1 style="font-size: 22px; color: #333; margin: 0;">Welcome to the ${newTeam.teamName} Team!</h1>
      </div>

      <!-- Content -->
      <div style="margin: 20px 0; padding: 10px; text-align: left;">
        <p style="font-size: 14px; color: #333; margin: 10px 0;">Hello ${emp.FirstName} 👋,</p>
        <p style="font-size: 14px; color: #333; margin: 10px 0;">
          You have been invited to join the <b>${newTeam.teamName}</b> team at <b>${emp.company.CompanyName}</b>.
        </p>
        <p style="font-size: 14px; color: #333; margin: 10px 0;">
          As a part of this team, you will collaborate with colleagues, participate in projects, and contribute to the company's success.
        </p>
        <p style="font-size: 14px; color: #333; margin: 10px 0;">
          Please click the button below to accept the invitation and get started.
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background-color: #007BFF; color: white; padding: 12px 24px; border-radius: 5px; 
              text-decoration: none; font-size: 16px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #333; margin: 10px 0;">We’re excited to have you on board!</p>
        <p style="font-size: 14px; color: #333; margin: 10px 0;">Best regards,</p>
        <p style="font-size: 14px; color: #333; margin: 10px 0;"><b>${createdPersonName}</b></p>
      </div>

      <!-- Footer -->
      <div style="font-size: 14px; margin-top: 20px; color: #777; text-align: center;">
        <p style="margin: 10px 0;">
          Have questions? Need help?
          <a href="mailto:${process.env.FROM_MAIL}" style="color: #007BFF; text-decoration: none;">
            Contact ${emp.company.CompanyName}
          </a>.
        </p>
      </div>
    </div>
  </body>
</html>
 `,
                })
            })
            res.send({ message: `new ${newTeam.teamName} team has been added!`, newTeam })
        }
    } catch (error) {
        console.log(error);

        res.status(500).send({ error: error.message })
    }
})

router.put("/:id", verifyAdminHRTeamHigherAuth, async (req, res) => {
    try {
        const { error } = TeamValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const response = await Team.findByIdAndUpdate(req.params.id, req.body)
        if (!response) {
            res.status(404).send({ error: "Team not found!" })
        }
        res.send({ message: "Team has been Updated!" })
    } catch (err) {
        if (err.name == "ValidationError") {
            res.status(400).send({ message: "ValidationError", details: err.details })
        } else {
            console.log(err);

            res.status(500).send({ message: err.message })
        }
    }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
    try {
        // const {orgName} = jwt.decode(req.headers['authorization']);
        // const Team = getTeamModel(orgName)
        const response = await Team.findByIdAndDelete(req.params.id);
        if (!response) {
            res.status(404).send({ message: "Team not found!" })
        } else {
            res.send({ message: "Team has been deleted!" })
        }
    } catch (err) {
        res.status(500).send({ message: "error in delete Team", error: err })
    }
})


module.exports = router;