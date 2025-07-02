const express = require("express");
const { verifyAdmin, verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Timezone, timeZoneValidation } = require("../models/timezoneModel");
const { Employee } = require("../models/EmpModel");
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { errorCollector } = require("../Reuseable_functions/reusableFunction");
const configPath = path.join(__dirname, '../timezoneData/timezoneData.json');

// Read JSON file
const readData = () => {
    const rawData = fs.readFileSync(configPath);
    return JSON.parse(rawData);
};

router.get("/values", verifyAdmin, async (req, res) => {
    try {
        const fullData = readData();
        if (fullData.length) {
            const values = fullData.map((item) => item.value);
            return res.send(values);
        } else {
            return res.status(404).send({ error: "Timezone data's values not found" })
        }

    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log("error in get timezone values", error);
        return res.status(500).send({ error: error.message })
    }
})

router.get("/name", verifyAdmin, async (req, res) => {
    try {
        const { value } = req.query;

        const fullData = readData();
        if (fullData.length) {
            const actualTimezone = fullData.find((item) => item.value === value);

            if (!actualTimezone) {
                return res.status(404).send({ error: `No UTC data not found in ${value}` })
            } else {
                return res.send({ timeZones: actualTimezone.utc });
            }
        } else {
            return res.status(404).send({ error: "Timezone data's values not found" })
        }
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log("error in get name's utc", error);
        return res.status(500).send({ error: error.message })
    }
})

router.post("/:id", verifyAdmin, async (req, res) => {
    try {
        // check validation
        const { error } = timeZoneValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const { company, timeZone } = req.body;

        // check already exists
        if (await Timezone.exists({ company, timeZone })) {
            return res.status(400).send({ error: `${timeZone} is already exists` })
        }
        const newTimezone = {
            ...req.body,
            createdBy: req.params.id
        }
        // add timezone 
        const timeZoneData = await Timezone.create(newTimezone);
        return res.send({ message: `${timeZoneData.timeZone} is added successfully`, timeZoneData })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error("error in add timezone", error)
        return res.status(500).send({ error: error.message })
    }
})

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    const emp = await Employee.findById(req.params.id, "company")
        .lean().exec();
    if (emp.company) {
        const timeZoneData = await Timezone.findOne({ company: emp.company })
            .populate("company", "logo CompanyName")
            .exec();

        if (!timeZoneData) {
            return res.status(200).send({ error: `You are not yet add time zone` })
        } else {
            return res.send(timeZoneData)
        }
    } else {
        return res.status(404).send({ error: "your are not in any company" })
    }
})

router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        // check is exists
        if (!await Timezone.exists({ _id: req.params.id })) {
            return res.status(404).send({ error: "Timezone is not in given ID" })
        }
        // check validation
        const { error } = timeZoneValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        } else {
            const updatedTimeZone = await Timezone.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
            return res.send({ message: `${updatedTimeZone.timeZone} timezone is updated successfully` })
        }
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error("error in update timezone", error);
        return res.status(500).send({ error: error.message })
    }
})
module.exports = router;
