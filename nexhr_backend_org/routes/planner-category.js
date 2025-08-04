const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { PlannerCategory } = require("../models/PlannerCategoryModel");
const { PlannerType } = require("../models/PlannerTypeModel");
const { errorCollector, checkValidObjId } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  const employeeId = req.params.id;
  const { name, ...rest } = req.body;

  if (!checkValidObjId(employeeId)) {
    return res.status(400).send({ error: "Invalid employee ID format" });
  }

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).send({ error: "Category name is required and must be a non-empty string" });
  }

  try {
    // Create new category
    const newCategory = await PlannerCategory.create({ name: name.trim(), ...rest });

    // Find planner type for the employee
    const empPlanner = await PlannerType.findOne({ employee: employeeId });

    if (!empPlanner) {
      return res.status(404).send({ error: "Planner not found for the employee" });
    }

    // Push new category to planner and save
    empPlanner.categories.push(newCategory._id);
    await empPlanner.save();

    return res.send({ message: `${newCategory.name} category has been added successfully` });
  } catch (error) {
    await errorCollector({
      url: req.originalUrl,
      name: error.name,
      message: error.message,
      env: process.env.ENVIRONMENT
    });
    console.error("Error in add category", error);
    return res.status(500).send({ error: error.message });
  }
});

module.exports = router;