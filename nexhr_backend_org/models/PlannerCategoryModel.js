const mongoose = require("mongoose");

const plannerCategorySchema = new mongoose.Schema({
    name: { type: String }
})

const PlannerCategory = mongoose.model("PlannerCategory", plannerCategorySchema);

PlannerCategory.countDocuments().then((count) => {
    if (count === 0) {
        const staticCategories = [
            { name: "Not Planned" },
            { name: "To be done this week" }
        ];

        PlannerCategory.insertMany(staticCategories)
            .then(() => console.log("Categories inserted"))
            .catch(err => console.error("Error inserting categories:", err));
    }
})

module.exports = {
    plannerCategorySchema, PlannerCategory
}

