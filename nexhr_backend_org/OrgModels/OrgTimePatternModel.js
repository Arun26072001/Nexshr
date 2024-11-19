const mongoose = require("mongoose");
const Joi = require("joi");
const OrgTimePatternSchemas = {};

// Function to get the time pattern schema for a specific organization
function getTimePatternSchema(orgName) {
    if (!OrgTimePatternSchemas[orgName]) {
        OrgTimePatternSchemas[orgName] = new mongoose.Schema({
            PatternName: { type: String, required: true },
            DefaultPattern: { type: Boolean, required: true },
            StartingTime: { type: String, required: true },
            FinishingTime: { type: String, required: true },
            BreakTime: { type: String, required: true },
            WeeklyDays: { type: Number, required: true },
            PublicHoliday: { type: String, required: true }
        })
    }
    return OrgTimePatternSchemas[orgName];
}

const OrgTimePatternModels = {};

// Function to get the time pattern model for a specific organization
function getTimePatternModel(orgName) {
    if (!OrgTimePatternModels[orgName]) {
        OrgTimePatternModels[orgName] = mongoose.model(`${orgName}_TimePattern`, getTimePatternSchema(orgName));
    }
    return OrgTimePatternModels[orgName];
}

const timePatternValidation = Joi.object().keys({
    PatternName: Joi.string().required(),  // PatternName should be a non-empty string
    DefaultPattern: Joi.boolean().required(),  // DefaultPattern should be a boolean
    StartingTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/).required(),  // Time format (HH:MM)
    FinishingTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/).required(),  // Time format (HH:MM)
    BreakTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/).required(),  // Time format (HH:MM)
    WeeklyDays: Joi.number().integer().min(1).max(7).required(),  // WeeklyDays should be a number between 1 and 7
    PublicHoliday: Joi.string().required()  // PublicHoliday should be a non-empty string
});

module.exports = { getTimePatternModel, timePatternValidation }