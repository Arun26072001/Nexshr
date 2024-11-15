const mongoose = require("mongoose");

const WorkPlaceSchemas = {};

function getWorkPlaceSchema(orgName) {
    if (!WorkPlaceSchemas[orgName]) {
        WorkPlaceSchemas[orgName] = new mongoose.Schema({
            orgId: { type: mongoose.Schema.Types.ObjectId, unique: true, ref: "Org" },
            Address_1: { type: String },
            Address_2: { type: String },
            Country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
            State: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
            PostCode: { type: Number },
            EmpID: [{ type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Employee` }],
            Town: { type: String },
        })
    }
    return WorkPlaceSchemas[orgName];
}

const WorkPlaceModels = {};

function getWorkPlaceModel(orgName) {
    if (!WorkPlaceModels[orgName]) {
        WorkPlaceModels[orgName] = mongoose.model(`${orgName}WorkPlace`, getWorkPlaceSchema(orgName));
    }
    return WorkPlaceModels[orgName];
}

const WorkPlaceValidation = Joi.object().keys({
    _id: Joi.optional(),
    CompanyName: Joi.string()
        .max(100)
        .required(),
    Address_1: Joi.string()
        .max(100)
        .required(),
    Address_2: Joi.string().optional(),
    Country: Joi.array().items(Joi.objectId().required()).min(1).required(),
    State: Joi.array().items(Joi.objectId().required()).min(1).required(),
    Town: Joi.string()
        .max(100)
        .required(),
    PostCode: Joi.number().integer().min(10000).max(999999).optional(),
    EmpID: Joi.optional()
});

module.exports = { getWorkPlaceModel, WorkPlaceValidation }