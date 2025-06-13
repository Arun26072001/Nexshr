const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { PlannerType } = require("../models/PlannerTypeModel");
const { PlannerCategory } = require("../models/PlannerCategoryModel");
const router = express.Router();

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const planner = await PlannerType.findOne({ employee: req.params.id }, "categories")
        .populate("categories")
        .lean().exec();
        if (!planner) {
            return res.status(200).send({ categories: [] })
        }

        return res.send({ categories: planner.categories })
    } catch (error) {
        console.log("error in get categories", error);
        return res.status(500).send({ error: error.message })
    }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const addCategory = await PlannerCategory.create(req.body.category);
        const plannerData = await PlannerType.findOne({ employee: req.params.id }).lean().exec();
        if (!plannerData) {
            return res.send({ error: "Planner data not found" })
        }
        plannerData.push(addCategory._id);
        await plannerData.save();
        return res.send({ message: "task planner has been updated successfully" })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;

