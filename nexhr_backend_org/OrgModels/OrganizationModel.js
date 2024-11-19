const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require("joi");

// Now use feedSchema in appFormSchema
var orgSchema = new Schema({
    orgName: { type: String },
    orgImg: { type: String },
    createdAt: { type: Date, default: Date.now },
}, { strict: false });

const Org = mongoose.model("Org", orgSchema);

const OrgValidation = Joi.object({
    orgName: Joi.string().required().label("Organization Name"),
    orgImg: Joi.string().required().label("Organization Image")
})
module.exports = { Org, orgSchema, OrgValidation };