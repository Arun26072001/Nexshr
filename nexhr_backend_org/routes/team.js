const express = require("express");
const router = express.Router();
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork, verifyAdminHREmployee, verifyAdminHRTeamHigherAuth, verifyTeamHigherAuthority, verifyTeamHigherAuthorityEmp } = require("../auth/authMiddleware");
const { TeamValidation, Team } = require("../models/TeamModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");

const sendInvitationEmail = async (emp, roleLabel, team, creator) => {
    const frontendUrl = process.env.REACT_APP_API_URL;
    const empName = `${emp.FirstName[0].toUpperCase() + emp.FirstName.slice(1)} ${emp.LastName}`;
    const CompanyName = creator.company.CompanyName;
    console.log(creator.company);

    const emailContent = `
        <div style="text-align: center;">
            <img src="${creator.company.logo}" alt="${CompanyName}" style="width: 100px; height: 100px; object-fit: cover; margin-top: 20px;" />
            <div style="display: flex; max-width:600px; margin:0 auto;padding: 20px;">
                <div style="border: 1px solid gray; border-radius: 10px; padding: 30px; max-width: 500px; text-align: left; background-color: #fff;">
                    <h2 style="font-size: 20px; font-weight: 500; margin-bottom: 10px;">Hi ${empName},</h2>
                    <div style="border-bottom: 3px solid green; width: 30px; margin-bottom: 10px;"></div>
                    <p style="font-size: 15px;">${creator.FirstName[0].toUpperCase() + creator.FirstName.slice(1)} has invited you to join the <strong>${team.teamName}</strong> team at <strong>${CompanyName}</strong>.</p>
                    <p>Click the button below to accept your invitation and join the team:</p>
                    <p style="font-weight: bold; color: green;">Position: ${roleLabel}</p>
                    <a href="${frontendUrl}" style="display: inline-block; padding: 12px 24px; border-radius: 30px; background-color: #4CAF50; color: white; text-decoration: none; font-weight: bold; margin: 15px 0;">Join Team</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p><a href="${frontendUrl}">${frontendUrl}</a></p>
                    <p style="margin-top: 20px;">Welcome aboard!<br>The ${CompanyName} Team</p>
                </div>
            </div>
        </div>
    `;

    await sendMail({
        From: creator.Email,
        To: emp.Email,
        Subject: `You're invited to join the ${team.teamName} team at ${CompanyName}`,
        HtmlBody: emailContent
    });
};

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const teams = await Team.find()
        res.send(teams)
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: err.message });
    }
});

router.get("/members/:id", verifyTeamHigherAuthorityEmp, async (req, res) => {
    try {
        const who = req.params.who ? "lead" : req.params.who ? "head" : req.params.who ? "manager" : "employees"
        const response = await Team.findOne({ [who]: req.params.id })
            .populate({
                path: "employees",
                select: "_id FirstName LastName",
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

router.post("/:id", verifyAdminHR, async (req, res) => {
    try {
        const { error } = TeamValidation.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const creator = await Employee.findById(req.params.id, "FirstName LastName company Email").populate("company", "logo CompanyName");
        if (!creator) return res.status(404).json({ error: "Creator not found!" });

        const { teamName, lead, head, manager, employees, admin, hr } = req.body;
        const existingTeam = await Team.findOne({ teamName });
        if (existingTeam) return res.status(400).json({ error: `Team "${teamName}" already exists!` });

        const roles = { lead, head, manager, employees, hr, admin };
        const allMemberIds = [...new Set(Object.values(roles).flat())];

        const newTeam = await Team.create({
            ...req.body,
            employees: allMemberIds,
            createdBy: req.params.id,
        });

        await Promise.all(
            Object.entries(roles).flatMap(([role, ids]) =>
                ids.map(async (memberId) => {
                    const emp = await Employee.findById(memberId, "FirstName LastName Email fcmToken").populate("company", "CompanyName logo");
                    if (!emp) return;

                    emp.team = newTeam._id;
                    await emp.save();

                    const roleLabel = role === "employees" ? "Employee" : role.charAt(0).toUpperCase() + role.slice(1);
                    await sendInvitationEmail(emp, roleLabel, req.body, creator);
                })
            )
        );

        res.json({ message: `New team "${newTeam.teamName}" has been added!`, newTeam });

    } catch (error) {
        console.error("POST /:id error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/:id", verifyAdminHRTeamHigherAuth, async (req, res) => {
    try {
        const { error } = TeamValidation.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const teamId = req.params.id;
        const { lead, head, manager, employees, admin, hr, createdBy } = req.body;
        const roles = { lead, head, manager, employees, hr, admin };

        const creator = await Employee.findById(createdBy, "FirstName LastName company").populate("company", "CompanyName logo");
        if (!creator) return res.status(404).json({ error: "Creator not found!" });

        const oldTeam = await Team.findById(teamId).populate("lead head manager employees hr admin", "_id");
        if (!oldTeam) return res.status(404).json({ error: "Team not found!" });

        for (const [roleKey, newIdsRaw] of Object.entries(roles)) {
            const oldIds = (oldTeam[roleKey] || []).map(e => e._id.toString());
            const newIds = newIdsRaw.map(String);

            const addedIds = newIds.filter(id => !oldIds.includes(id));
            const removedIds = oldIds.filter(id => !newIds.includes(id));

            // Add members
            await Promise.all(addedIds.map(async (empId) => {
                const emp = await Employee.findById(empId).populate("company", "CompanyName logo");
                if (!emp) return;

                emp.team = teamId;
                await emp.save();

                const roleLabel = roleKey === "employees" ? "Employee" : roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
                await sendInvitationEmail(emp, roleLabel, oldTeam.teamName, creator);
            }));

            // Remove members
            await Promise.all(removedIds.map(async (empId) => {
                const emp = await Employee.findById(empId);
                if (!emp) return;

                emp.team = null;
                await emp.save();
            }));
        }

        const updatedTeam = await Team.findByIdAndUpdate(teamId, req.body, { new: true });
        res.json({ message: `Team "${updatedTeam.teamName}" has been updated!`, updatedTeam });

    } catch (err) {
        console.error("PUT /:id error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", verifyAdminHR, async (req, res) => {
    try {
        const teamData = await Team.findById(req.params.id);
        if (teamData?.employees?.length) {
            return res.status(400).send({ error: `${teamData.employees.length} employees has in ${teamData.teamName}, Please change the team for them` })
        }
        const response = await Team.findByIdAndDelete(req.params.id);
        if (!response) {
            res.status(404).send({ message: "Team not found!" })
        } else {
            res.send({ message: `${response?.teamName} Team has been deleted!` })
        }
    } catch (err) {
        console.log("erorr in delete team", err);
        res.status(500).send({ error: err })
    }
})


module.exports = router;
        
                // Check if members already belong to a team
                // for (const role of higherAuth) {
                //     const members = roles[role];
                //     if (Array.isArray(members) && members.length) {
                //         for (const memberId of members) {
                //             const exists = await Team.exists({ [role]: memberId });
                //             if (exists) {
                //                 const emp = await Employee.findById(memberId, "FirstName LastName team")
                //                     .populate("team", "teamName");
                //                 console.log(emp);
        
                //                 return res.status(400).send({
                //                     error: `${emp.FirstName} ${emp.LastName} is already in ${emp.team.teamName} team`
                //                 });
                //             }
                //         }
                //     }
                // }