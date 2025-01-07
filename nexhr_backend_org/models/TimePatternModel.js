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
    TimePattern, TimePatternValidation
};