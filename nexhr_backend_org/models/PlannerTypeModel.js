const mongoose = require("mongoose");

const PlannerTypeSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "PlannerCategory" }]
})

const PlannerType = mongoose.model("plannertypes", PlannerTypeSchema);

module.exports = {
    PlannerType, PlannerTypeSchema
}