const mongoose = require("mongoose");

const LeaveRecordSchema = mongoose.Schema({
    TotalLeaveDays: {type: Number, required: true },
    TakenLeaveDays: {type: Number, required: true},
    RemainingLeaveDays: {type: Number}
})