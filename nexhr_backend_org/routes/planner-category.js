const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { PlannerCategory } = require("../models/PlannerCategoryModel");
const { PlannerType } = require("../models/PlannerTypeModel");
const router = express.Router();

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        if (![" ", null, "undefined"].includes(req.body.name)) {
            // add planner in planner collection
            const add = await PlannerCategory.create(req.body);
            const empPlanner = await PlannerType.findOne({employee: req.params.id}).exec();
            empPlanner.categories.push(add._id);
            await empPlanner.save();
            return res.send({message: `${add.name} category has been added successfully`})
        } else {
            return res.status(400).send({ error: "Category name is required" })
        }
    } catch (error) {
        console.error("error in add category", error);
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;