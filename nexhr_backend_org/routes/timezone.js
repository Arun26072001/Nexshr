const express = require("express");
const { verifyAdmin, verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Timezone, timeZoneValidation } = require("../models/timezoneModel");
const { Employee } = require("../models/EmpModel");
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { errorCollector, checkValidObjId, getCompanyIdFromToken } = require("../Reuseable_functions/reusableFunction");
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

// Add timezone
router.post("/:id", verifyAdmin, async (req, res) => {
    try {
        const { error } = timeZoneValidation.validate(req.body);
        if (error) return res.status(400).send({ error: error.details[0].message });

        const { company, timeZone } = req.body;

        if (await Timezone.exists({ company, timeZone })) {
            return res.status(400).send({ error: `${timeZone} already exists` });
        }

        const timeZoneData = await Timezone.create({
            ...req.body,
            createdBy: req.params.id,
        });

        return res.send({ message: `${timeZoneData.timeZone} is added successfully`, timeZoneData });
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT,
        });
        res.status(500).send({ error: error.message });
    }
});

// Get timezone by employee
router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        if (!checkValidObjId(req.params.id)) {
            return res.status(400).send({ error: "Invalid Employee ID" });
        }
        const companyId = getCompanyIdFromToken(req.headers["authorization"]);
        if (!companyId) {
            return res.status(400).send({
                error: "You are not part of any company. Please check with your higher authorities."
            });
        }

        const timeZoneData = await Timezone.findOne({ company: companyId })
            .populate("company", "logo CompanyName")
            .exec();

        if (!timeZoneData) {
            return res.status(200).send({ error: "You have not yet added a time zone" });
        }

        return res.send(timeZoneData);
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT,
        });
        res.status(500).send({ error: error.message });
    }
});

// Update timezone
router.put("/:id", verifyAdmin, async (req, res) => {
    if (!checkValidObjId(req.params.id)) {
        return res.status(400).send({ error: "Invalid timezone ID" });
    }
    try {
        const { error } = timeZoneValidation.validate(req.body);
        if (error) return res.status(400).send({ error: error.details[0].message });

        const updatedTimeZone = await Timezone.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        if (!updatedTimeZone) {
            return res.status(404).send({ error: "Timezone not found" });
        }

        return res.send({ message: `${updatedTimeZone.timeZone} timezone updated successfully` });
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT,
        });
        res.status(500).send({ error: error.message });
    }
});

// remove the timezone
router.delete("/:id", verifyAdmin, async (req, res) => {
    if (!checkValidObjId(req.params.id)) {
        return res.status(400).send({ error: "Invalid timezone ID" });
    }

    try {
        const deletedTimeZone = await Timezone.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }
        ).exec();

        if (!deletedTimeZone) {
            return res.status(404).send({ error: "Timezone not found" });
        }

        return res.send({ message: `${deletedTimeZone.timeZone} timezone deleted successfully.` });
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT,
        });
        res.status(500).send({ error: "An error occurred while deleting the timezone." });
    }
});


module.exports = router;
