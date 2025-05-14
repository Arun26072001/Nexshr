const express = require("express");
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Holiday, HolidayValidation } = require("../models/HolidayModel");
const router = express.Router();

router.post("/", verifyAdminHR, async (req, res) => {
    try {

        const isExist = await Holiday.findOne({ currentYear: req.body.currentYear });
        if (isExist) {
            return res.status(400).send({ error: "Already added this year of holidays!" })
        }

        const { error } = HolidayValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const response = await Holiday.create(req.body);
        return res.send({ message: "holiday has been added.", data: response.data });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

router.get("/:year", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const response = await Holiday.findOne({ currentYear: req.params.year }).exec();
        if (!response) {
            return res.status(200).send({ message: `Please add ${req.params.year} year of holidays!` })
        } else {
            return res.send(response);
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/", verifyAdminHR, async (req, res) => {
    try {
        const allYear = await Holiday.find().lean().exec();
        return res.send(allYear)
    } catch (error) {
        return res.status(500).send({ erorr: error.message })
    }
})

router.put("/:id", verifyAdminHR, async (req, res) => {
    try {
        // check it's exists
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).send({ error: `${req.body.currentYear} holidays not found` })
        }
        // check it has error
        const { error } = HolidayValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.message })
        }
        const updatedHolidays = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.send({ message: `${updatedHolidays.currentYear} of holidays has been updated` })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).send({ error: "holiday not found" })
        }
        const deletedHoliday = await Holiday.findByIdAndDelete(req.params.id).exec();
        return res.send({ message: `${deletedHoliday.currentYear} of holiday has been deleted successfully` })
    } catch (error) {
        console.log("error in delete", error);
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;