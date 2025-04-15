var mongoose = require('mongoose');
var Joi = require("joi");

var timePatternSchema = new mongoose.Schema({
    PatternName: { type: String },
    DefaultPattern: { type: Boolean },
    StartingTime: { type: String },
    WaitingTime: { type: String },
    FinishingTime: { type: String },
    BreakTime: { type: String },
    WeeklyDays: [{ type: String }],
    PublicHoliday: { type: String }
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
        .optional(),
    StartingTime: Joi.string()
        .required(),
    FinishingTime: Joi.string()
        .required(),
    BreakTime: Joi.string()
        .required(),
    WaitingTime: Joi.string()
        .required(),
    WeeklyDays: Joi.array()
        .items(Joi.string())
        .required(),
    PublicHoliday: Joi.string()
        .required(),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt'),
    _id: Joi.string().allow("").label('_id'),
    __v: Joi.string().allow(0).label('__v')
});

module.exports = {
    TimePattern, TimePatternValidation, timePatternSchema
};