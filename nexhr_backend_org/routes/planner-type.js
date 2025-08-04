const express = require("express");
const mongoose = require("mongoose");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { PlannerType } = require("../models/PlannerTypeModel");
const { PlannerCategory } = require("../models/PlannerCategoryModel");
const { Employee } = require("../models/EmpModel");
const { errorCollector } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    const employeeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).send({ error: "Invalid employee ID format" });
    }

    try {
        const planner = await PlannerType.findOne({ employee: employeeId }, "categories")
            .populate("categories")
            .lean();

        return res.send({ categories: planner?.categories || [] });
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT
        });
        console.log("error in get categories", error);
        return res.status(500).send({ error: error.message });
    }
});

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    const employeeId = req.params.id;
    const { category } = req.body;

    if (!checkValidObjId(employeeId)) {
        return res.status(400).send({ error: "Invalid employee ID format" });
    }

    if (!category || !category.name || typeof category.name !== "string" || category.name.trim() === "") {
        return res.status(400).send({ error: "Category name is required" });
    }

    try {
        // Create the category
        const newCategory = await PlannerCategory.create({ ...category, name: category.name.trim() });

        // Find planner without .lean() to allow .save()
        const planner = await PlannerType.findOne({ employee: employeeId });
        if (!planner) {
            return res.status(404).send({ error: "Planner data not found" });
        }

        // Add category ID
        planner.categories.push(newCategory._id);
        await planner.save();

        return res.send({ message: "Task planner has been updated successfully" });
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT
        });
        return res.status(500).send({ error: error.message });
    }
});

router.post("/add-planner", async (req, res) => {
    try {
        const emps = await Employee.find({isDeleted:false}, "_id").exec();
        const addPlannerFor = [];
        // add planner types for all assignees
        const defaultCategories = await PlannerCategory.find({isDeleted:false}, "_id").exec();

        if (defaultCategories.length) {
            for (const emp of emps) {
                const exists = await PlannerType.exists({ employee: emp._id });
                if (!exists) {
                    const plannerdetails = {
                        employee: emp._id,
                        categories: defaultCategories.slice(0, 2),
                    };

                    const addedPlanner = await PlannerType.create(plannerdetails);
                    addPlannerFor.push({ [emp.FirstName]: addedPlanner._id });
                }
            }
        }
        return res.send({ message: `planner type add for ${addPlannerFor.join(", ")}` })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log("error in add for emps", error)
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;

