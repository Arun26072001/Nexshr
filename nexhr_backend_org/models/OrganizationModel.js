
// const organizationSchema = new mongoose.Schema({
//     orgName: { type: String },
//     orgImg: { type: String },
//     createdAt: { type: Date, default: Date.now },
//     status: { type: Boolean, default: false },
// });

// const Organization = mongoose.model("Organization", organizationSchema);

// const organizationValidationSchema = Joi.object({
//     orgName: Joi.string().required(),
//     orgImg: Joi.string().uri().optional(), // Optional, expects a valid URI if provided
//     createdAt: Joi.date().default(Date.now), // Automatically sets to current date if not provided
//     status: Joi.boolean().default(false) // Defaults to false if not provided
// });

// module.exports = { Organization, organizationValidationSchema }

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Now use feedSchema in appFormSchema
var orgSchema = new Schema({
    orgName: { type: String },
    orgImg: { type: String },
    createdAt: { type: Date, default: Date.now },
}, { strict: false });

const Org = mongoose.model("Org", orgSchema);

module.exports = { Org, orgSchema };