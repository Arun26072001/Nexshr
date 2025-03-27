const mongoose = require("mongoose");
const Joi = require("joi")

const userAccountSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    countryCode: { type: String },
    phone: { type: String },
    // orgs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Organization" }],
    // Account: { type: Number, default: 0 }
})

const UserAccount = mongoose.model("UserAccount", userAccountSchema);

const userAccountValidation = Joi.object({
    name: Joi.string()
        .min(1)
        .max(100)
        .required(),

    email: Joi.string()
        .email(),
        // .required(),

    password: Joi.string()
        .min(6)
        .max(128),
        // .required(),

    countryCode: Joi.string(),
        // .required(),
    phone: Joi.string()
        .regex(/^\d{7,15}$/) // Accepts 7 to 15 digits
        .required(),
        
});


module.exports = { UserAccount, userAccountValidation }