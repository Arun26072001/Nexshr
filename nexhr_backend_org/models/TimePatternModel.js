var mongoose = require('mongoose');
var Joi = require("joi");

var timePatternSchema = new mongoose.Schema({
    PatternName: { type: String },
    DefaultPattern: { type: Boolean },
    StartingTime: { type: Date },
    WaitingTime: { type: String },
    FinishingTime: { type: Date },
    BreakTime: { type: String },
    WeeklyDays: [{ type: String }],
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    PublicHoliday: { type: String },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

var TimePattern = mongoose.model("TimePattern", timePatternSchema);

const TimePatternValidation = Joi.object({
    TimePatternID: Joi.optional(),
    PatternName: Joi.string()
        .disallow(null, '', 'none', 'undefined')
        .max(200)
        .required(),
    company: Joi.any().optional(),
    DefaultPattern: Joi.boolean()
        .optional(),
    StartingTime: Joi.string()
        .disallow(null, '', 'none', 'undefined')
        .required(),
    FinishingTime: Joi.string()
        .disallow(null, '', 'none', 'undefined')
        .required(),
    isDeleted: Joi.any().optional(),
    BreakTime: Joi.string()
        .disallow(null, '', 'none', 'undefined')
        .required(),
    WaitingTime: Joi.string()
        .disallow(null, '', 'none', 'undefined', 0)
        .required(),
    WeeklyDays: Joi.array()
        .items(Joi.string())
        .required(),
    PublicHoliday: Joi.string()
        .disallow(null, '', 'none', 'undefined')
        .required(),
    _id: Joi.string().allow("").optional(),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt'),
    __v: Joi.string().allow(0).label('__v')
}).custom((value, helpers) => {
    const start = new Date(value.StartingTime);
    const end = new Date(value.FinishingTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return helpers.message('StartingTime or FinishingTime is not a valid time');
    }

    if (start >= end) {
        return helpers.message('StartingTime must be earlier than FinishingTime');
    }
    return value;
});


module.exports = {
    TimePattern, TimePatternValidation, timePatternSchema
};