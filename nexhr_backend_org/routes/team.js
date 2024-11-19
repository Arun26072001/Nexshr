const express = require("express");
const router = express.Router();
const { verifyHR, verifyAdminHR } = require("../auth/authMiddleware");
const { TeamValidation, Team, TeamSchema } = require("../models/TeamModel");
const mongoose = require("mongoose");

// const teamModels = {};

// function getTeamModel(orgName) {
//     if (!teamModels[orgName]) {
//         teamModels[orgName] = mongoose.model(`${orgName}Team`, TeamSchema)
//     }
//     return teamModels[orgName];
// }

router.get("/", verifyAdminHR, async (req, res) => {
    try {
        // const { orgName } = jwt.decode(req.headers['authorization']);
        // const Team = getTeamModel(orgName)
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
        res.status(500).send({ message: "internal server error", details: err.message });
    }
});

router.get("/user", verifyAdminHR, async (req, res) => {
    try {
        // const { orgName } = jwt.decode(req.headers['authorization']);
        // const Team = getTeamModel(orgName)
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

router.get("/:id", verifyAdminHR, async (req, res) => {
    try {
        // const {orgName} = jwt.decode(req.headers['authorization']);
        // const Team = getTeamModel(orgName)
        const response = await Team.findById(req.params.id)
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
        // const validatedTeam = await TeamValidation.validate(req.body);
        // const {orgName} = jwt.decode(req.headers['authorization']);
        const Team = getTeamModel(orgName)
        const newTeam = await Team.create(validatedTeam);
        res.send({ message: "Team added!", newTeam });
    } catch (err) {
        console.error(err); // Use console.error for logging errors
        if (err.name === 'ValidationError') {
            res.status(400).send({ message: "Validation Error", details: err.details });
        } else {
            res.status(500).send({ message: "Internal Server Error" });
        }
    }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
    try {
        // const validatedTeam = await TeamValidation.validate(req.body);
        // const {orgName} = jwt.decode(req.headers['authorization']);
        const Team = getTeamModel(orgName)
        const response = await Team.findByIdAndUpdate(req.params.id, validatedTeam)
        if (!response) {
            res.status(404).send({ message: "Team not found!" })
        }
        res.send({ message: "Team has been Updated!" })
    } catch (err) {
        if (err.name == "ValidationError") {
            res.status(400).send({ message: "ValidationError", details: err.details })
        } else {
            res.status(500).send({ message: "Internal Server Error", details: err.details })
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