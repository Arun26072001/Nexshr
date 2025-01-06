const express = require("express");
const { verifyAdminHR, verifyAdminHREmployee } = require("../auth/authMiddleware");
const { Holiday, HolidayValidation } = require("../models/HolidayModel");
const router = express.Router();

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        const body = {
            ...req.body,
            currentYear: new Date().getFullYear()
        }
        console.log(body);

        const validation = HolidayValidation.validate(body);
        const { error } = validation;
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const response = await Holiday.create(body);
        return res.send(response);
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/:year", verifyAdminHREmployee, async (req, res) => {
    try {
        const response = await Holiday.findOne({ currentYear: req.params.year }).exec();
        if (!response) {
            return res.status(404).send({ error: `Please add ${req.params.year} year of holidays!` })
        } else {
            return res.send(response);
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;