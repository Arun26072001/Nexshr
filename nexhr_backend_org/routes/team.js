const express = require("express");
const router = express.Router();
const { verifyAdminHR, verifyEmployee, verifyAdminHREmployeeManagerNetwork, verifyAdminHREmployee, verifyAdminHRTeamHigherAuth, verifyTeamHigherAuthority } = require("../auth/authMiddleware");
const { TeamValidation, Team } = require("../models/TeamModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");

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

router.get("/members/:id", verifyTeamHigherAuthority, async (req, res) => {
    try {
        const who = req.params.isLead ? "lead" : req.params.isLead ? "head" : req.params.isLead ? "manager" : "employees"
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
            res.status(404).send({ message: "You haven't in any team" })
        } else {
            res.send(response);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error in get a team of Employee", details: err })
    }
})

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

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        // Validate request body
        const { error } = TeamValidation.validate(req.body);
        if (error) return res.status(400).send({ error: error.details[0].message });

        const existingTeam = await Team.findOne({ teamName: req.body.teamName });
        if (existingTeam) {
            return res.status(400).send({ error: `"${req.body.teamName}" already exists!` });
        }
        const { employees = [], lead = [], head = [], manager = [] } = req.body;

        const withOutLeadHeadManagerInEmps = employees.filter(emp =>
            !lead.includes(emp) &&
            !head.includes(emp) &&
            !manager.includes(emp)
        );
        // Merge all roles into employees
        const allEmployees = [
            ...withOutLeadHeadManagerInEmps,
            ...lead,
            ...head,
            ...manager
        ];

        const newTeamData = { ...req.body, employees: allEmployees };
        const newTeam = await Team.create(newTeamData);

        // Fetch employees and update team-related info
        const employeesToUpdate = await Employee.find({ _id: req.body.employees }, "FirstName LastName teamLead team").populate("company", "CompanyName");

        // Created person name used in email (optional fallback)
        const createdPersonName = req.body.createdByName || "HR Team";

        // Update employees and send welcome emails in parallel
        await Promise.all(
            employeesToUpdate.map(async (emp) => {
                emp.teamLead = req.body.lead;
                emp.team = newTeam._id;
                await emp.save();

                const frontendUrl = process.env.REACT_APP_API_URL
                const companyName = emp?.company?.CompanyName || "Webnexs";
                const empName = emp.FirstName[0].toUpperCase() + emp.FirstName.slice(1) + " " + emp.LastName
                await sendMail({
                    From: process.env.FROM_MAIL,
                    To: emp.Email,
                    Subject: `You're invited to join the ${newTeam.name} team at ${companyName}`,
                    HtmlBody: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2>Hi ${empName},</h2>
                        <p>${createdPersonName} has invited you to join the <strong>${newTeam.name}</strong> team at <strong>${companyName}</strong>.</p>
                        <p>Click the button below to accept your invitation and join the team:</p>
                        <p>
                            <a href="${frontendUrl}" style="
                                display: inline-block;
                                padding: 10px 20px;
                                background-color: #4CAF50;
                                color: white;
                                text-decoration: none;
                                border-radius: 5px;
                            ">Join Team</a>
                        </p>
                        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                        <p><a href="${frontendUrl}">${frontendUrl}</a></p>
                        <p>Welcome aboard!<br>The ${companyName} Team</p>
                    </div>
                `
                });
            })
        );

        return res.send({ message: `New team "${newTeam.teamName}" has been added!`, newTeam });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message });
    }
});

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
        const teamData = await Team.findById(req.params.id);
        if (teamData.employees.length) {
            return res.status(400).send({ error: `${teamData.employees.length} employees has in ${teamData.teamName}, Please change the team for them` })
        }
        const response = await Team.findByIdAndDelete(req.params.id);
        if (!response) {
            res.status(404).send({ message: "Team not found!" })
        } else {
            res.send({ message: `${response.data.teamName} Team has been deleted!` })
        }
    } catch (err) {
        res.status(500).send({ error: err })
    }
})


module.exports = router;