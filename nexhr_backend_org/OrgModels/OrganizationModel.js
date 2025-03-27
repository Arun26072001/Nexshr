const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require("joi");

// Now use feedSchema in appFormSchema
var orgSchema = new Schema({
    orgName: { type: String },
    orgImg: { type: String },
    createdAt: { type: Date, default: Date.now },
    expireAt: { type: Date },
    status: { type: Boolean, default: true },
    entendValidity: { type: Number },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "UserAccount"},
    members: [{type: mongoose.Schema.Types.ObjectId, ref: "Employee"}]
}, { strict: false, timestamps: true });

const Org = mongoose.model("Org", orgSchema);

const OrgValidation = Joi.object({
    orgName: Joi.string().required().label("Organization Name"),
    orgImg: Joi.string().required().label("Organization Image"),
    createdAt: Joi.string().optional(),
    expireAt: Joi.string().optional(),
    status: Joi.string().optional(),
    entendValidity: Joi.number().optional()
})
module.exports = { Org, orgSchema, OrgValidation };