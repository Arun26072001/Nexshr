const express = require("express");
const router = express.Router();
const { verifyHR, verifyAdminHR } = require("../auth/authMiddleware");
const { TeamValidation, Team } = require("../models/TeamModel");

router.get("/",verifyAdminHR , async(req, res)=>{
    try{
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
    }catch(err){
        console.error(err)
        res.status(500).send({message: "internal server error", details: err.message});
    }
})

router.get("/:id", verifyAdminHR, async(req, res)=>{
    try{
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
        if(!response){
            res.status(404).send({message: "team not found"})
        }else{
            res.send(response);
        }
    }catch(err){
        console.log(err);
        res.status(500).send({message: "Error in get a team of Employee", details: err})
    }
})

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        const validatedTeam = await TeamValidation.validate(req.body);
        const newTeam = await Team.create(validatedTeam);
        await newTeam.save();  // Ensure the save operation is awaited
        res.status(201).send({ message: "Team added!" });
    } catch (err) {
        console.error(err); // Use console.error for logging errors
        if (err.name === 'ValidationError') {
            res.status(400).send({ message:"Validation Error",details: err.details });
        } else {
            res.status(500).send({ message: "Internal Server Error" });
        }
    }
});

router.put("/:id", verifyAdminHR, async(req, res)=>{
    try{
        const validatedTeam = await TeamValidation.validate(req.body);
        const response = await Team.findByIdAndUpdate(req.params.id, validatedTeam)
        if(!response){
            res.status(404).send({message: "Team not found!"})
        }
        res.send({message: "Team has been Updated!"})
    }catch(err){
        if(err.name == "ValidationError"){
            res.status(400).send({message: "ValidationError", details: err.details})
        }else{
            res.status(500).send({message: "Internal Server Error", details: err.details })
        }
    }
})

router.delete("/:id", verifyAdminHR, async(req, res)=>{
    try{
        const response = await Team.findByIdAndDelete(req.params.id);
        if(!response){
            res.status(404).send({message: "Team not found!"})
        }else{
            res.send({message: "Team has been deleted!"})
        }
    }catch(err){
        res.status(500).send({message: "error in delete Team", error: err })
    }
})


module.exports = router;