const mongoose = require("mongoose");
const Joi = require("joi");
const OrgClockinSchemas = {};

function getClockinSchema(orgName) {
    if (!OrgClockinSchemas[orgName]) {
        const timeRangeSchema = new mongoose.Schema({
            startingTime: {
                type: String,
                validate: {
                    validator: function (v) {
                        return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v);
                    },
                    message: props => `${props.value} is not a valid time!`
                }
            },
            endingTime: {
                type: String,
                validate: {
                    validator: function (v) {
                        return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v);
                    },
                    message: props => `${props.value} is not a valid time!`
                }
            },
            timeHolder: {
                type: String
            }
        }, { _id: false })

        OrgClockinSchemas[orgName] = new mongoose.Schema({
            date: {
                type: Date
            },
            login: {
                type: timeRangeSchema
            },
            meeting: {
                type: timeRangeSchema
            },
            morningBreak: {
                type: timeRangeSchema
            },
            lunch: {
                type: timeRangeSchema
            },
            eveningBreak: {
                type: timeRangeSchema
            },
            event: {
                type: timeRangeSchema
            },
            behaviour: { type: String },
            punchInMsg: { type: String },
            employee: { type: mongoose.Types.ObjectId, ref: `${orgName}_Employee` }
        })
    }
    return OrgClockinSchemas[orgName];
}

const OrgClockinModels = {};

function getClockinModel(orgName) {
    if (!OrgClockinModels[orgName]) {
        OrgClockinModels[orgName] = mongoose.model(`${orgName}_Clockins`, getClockinSchema(orgName));
    }
    return OrgClockinModels[orgName];
}

const timeRangeValidation = Joi.object({
    startingTime: Joi.string(),
    endingTime: Joi.string(),
    // takenTime: Joi.number(),
    timeHolder: Joi.string()
});

const clockInsValidation = Joi.object({
    date: Joi.string().required(),
    login: timeRangeValidation,
    meeting: timeRangeValidation,
    morningBreak: timeRangeValidation,
    lunch: timeRangeValidation,
    eveningBreak: timeRangeValidation,
    event: timeRangeValidation
});

module.exports = { getClockinModel, clockInsValidation };
