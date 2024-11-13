const express = require("express");
const { Org } = require("../models/OrganizationModel");
const router = express.Router();
const mongoose = require("mongoose");

async function createEmpCollection(orgName){
    const empSchema = new mongoose.Schema({
        name: {type: String},
        email: {type: String},
        password: {type: String}
    });
    const Employee = mongoose.model(`${orgName}Employee`, empSchema);
}

router.post("/", async (req, res) => {
    try {
        const addOrg = await Org.create(req.body);
        // createEmpCollection(req.body.orgName)
        res.send({ message: `Org has been saved ${addOrg}` })
    } catch (err) {
        res.status(500).send({ error: err.message })
    }
})

// router.post("/add", (req,res)=>{
//     const addEmpInNexsHR = await 
// })

module.exports = router;