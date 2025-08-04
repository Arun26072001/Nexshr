const express = require('express');
const router = express.Router();
const Joi = require("joi");
const { verifyAdminHREmployeeManagerNetwork, verifyAdmin } = require('../auth/authMiddleware');
const fs = require('fs');
const path = require('path');
const { errorCollector } = require('../Reuseable_functions/reusableFunction');
const configPath = path.join(__dirname, '../countriesData/countryCode.json');

// country validation 
const CountryValidation = Joi.object().keys({
  name: Joi.string().disallow(null, ' ', 'none', 'undefined').required(),
  icon: Joi.string().disallow(null, ' ', 'none', 'undefined').required(),
  abbr: Joi.string().disallow(null, ' ', 'none', 'undefined').required(),
  code: Joi.string().disallow(null, ' ', 'none', 'undefined').required(),
  states: Joi.array().items(Joi.string()).optional()
});

// Read JSON file
const readData = () => {
    const rawData = fs.readFileSync(configPath);
    return JSON.parse(rawData);
};

// Write to JSON file
const writeData = (data) => {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
};

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const rawData = readData();
        return res.send(rawData);
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ error: error.message })
    }
})

// get state data
router.get("/:name", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const rawData = readData();
        const states = rawData.filter((item) => item.name === item[req.params.name]).states;
        if (states.length > 0) {
            return res.send(states)
        } else {
            return res.status(404).send({ error: `States data not found in ${req.params.name}` })
        }
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        return res.status(500).send({ error: error.message })
    }
})

// Create a Country or state
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const countries = readData();

        const isExists = countries.filter((item) => item.code === req.body.code);

        if (isExists.length > 0) {
            return res.status(400).send({ error: "Country code is already exists" })
        }

        // check validation for country
        const { error } = CountryValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }

        countries.push(req.body);
        writeData(countries);
        res.status(201).send({ message: "New country is Add successfully" });

    } catch (error) {
        console.error("error in add country", error)
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        res.status(500).json({ error: error.message });
    }
})

router.put("/:code", verifyAdmin, async (req, res) => {
    try {
        const countries = readData();
        const index = countries.findIndex(country => country.code === req.params.code);
        if (index === -1) return res.status(404).json({ message: "Country not found" });
        const country = countries[index];
        country.states.push(req.body.states)
        countries[index] = { ...country, ...req.body };
        // Save changes
        writeData(countries);
        return res.json({ message: "Country is updated successfully", data: countries[index] });

    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;