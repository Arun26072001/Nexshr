const mongoose = require("mongoose");

const plannerCategorySchema = new mongoose.Schema({
    name: { type: String }
})

const PlannerCategory = mongoose.model("plannercategories", plannerCategorySchema);

module.exports = {
    plannerCategorySchema, PlannerCategory
}

