var mongoose = require('mongoose');
var Joi = require("joi");

var timePatternSchema = new mongoose.Schema({
    PatternName: { type: String, required: true },
    DefaultPattern: { type: Boolean, required: true },
    StartingTime: { type: String, required: true },
    FinishingTime: { type: String, required: true },
    BreakTime: { type: String, required: true },
    WeeklyDays: { type: Number, required: true },
    PublicHoliday: { type: String, required: true }
}, { timestamps: true })

var TimePattern = mongoose.model("TimePattern", timePatternSchema);
const staticPatterns = [
    {
        "PatternName": "MON - FRI",
        "WeeklyDays": 5,
        "StartingTime": "9:00",
        "FinishingTime": "18:30",
        "BreakTime": "60",
        "DefaultPattern": true,
        "PublicHoliday": "Deducated",
    },
    {
        "PatternName": "MON - FRI",
        "WeeklyDays": 5,
        "StartingTime": "14:00",
        "FinishingTime": "00:00",
        "BreakTime": "60",
        "DefaultPattern": true,
        "PublicHoliday": "Deducated",
    }
]

TimePattern.countDocuments().then(count => {
    if (count === 0) {
        TimePattern.insertMany(staticPatterns)
            .then(() => console.log("Static users inserted!"))
            .catch(err => console.error("Error inserting users:", err));
    } else {
        console.log("Users already exist. Skipping static data insertion.");
    }
});

var TimePatternValidation = Joi.object().keys({
    _id: Joi.optional(),
    TimePatternID: Joi.optional(),
    PatternName: Joi.string()
        .max(200)
        .required(),
    DefaultPattern: Joi.boolean()
        .required(),
    StartingTime: Joi.string()
        .required(),
    FinishingTime: Joi.string()
        .required(),
    BreakTime: Joi.string()
        .required(),
    WeeklyDays: Joi.number()
        .max(7)
        .required(),
    PublicHoliday: Joi.string()
        .required()
});

module.exports = {
    TimePattern, TimePatternValidation, timePatternSchema
};