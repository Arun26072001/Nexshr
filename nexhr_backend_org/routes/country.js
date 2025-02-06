const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyAdminHREmployee, verifyAdmin } = require('../auth/authMiddleware');
const configPath = path.join(__dirname, '../countriesData/countryCode.json');

// Read JSON file
const readData = () => {
    const rawData = fs.readFileSync(configPath);
    return JSON.parse(rawData);
};

// Write to JSON file
const writeData = (data) => {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
};

router.get("/", verifyAdminHREmployee, async (req, res) => {
    try {
        const rawData = readData();
        return res.send(rawData);
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

// get state data
router.get("/:name", verifyAdminHREmployee, async (req, res) => {
    try {
        const rawData = readData();
        const states = rawData.filter((item) => item.name === item[req.params.name]).states;
        if (states.length > 0) {
            return res.send(states)
        } else {
            return res.status(404).send({ error: `States data not found in ${req.params.name}` })
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

// Create a Country or state
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const countries = readData();
        console.log(countries);

        const isExists = countries.filter((item) => item.code === req.body.code);
        // const stateExists = countries.filter((item)=> item)
        // if()
        if (isExists.length > 0) {
            return res.status(400).send({ error: "Country already Exists" })
        } else {
            countries.push(req.body);
            writeData(countries);
            res.status(201).send({ message: "New country is Add successfully" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.put("/:code", verifyAdmin, async (req, res) => {
    try {
        const countries = readData();
        const index = countries.findIndex(country => country.code === req.params.code);

        if (index === -1) return res.status(404).json({ message: "Country not found" });

        const country = countries[index];
        // // Ensure state array exists
        // if (!country.state) country.state = [];

        // Check if state already exists
        // const isExistState = country.state.some(item => item === req.body.state);
        // if (isExistState) {
        //     return res.status(400).send({ error: `${req.body.state} state already exists` });
        // }

        country.state.push(req.body.state)

        countries[index] = { ...country, ...req.body };
        // Save changes
        writeData(countries);
        return res.json({ message: "Country is updated successfully", data: countries[index] });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;