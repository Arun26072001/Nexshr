const mongoose = require("mongoose");
const Joi = require("joi")

const userAccountSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    orgs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Organization" }],
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    Account: {type: Number, default: 0}
})

const UserAccount = mongoose.model("UserAccount", userAccountSchema);

const userAccountValidation = Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),  // Minimum 8 characters for password
    orgId: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(), // Valid MongoDB ObjectId
    createdAt: Joi.date(), 
    expiresAt: Joi.date().greater(Joi.ref('createdAt')).optional() // Should be a date after createdAt
});

module.exports = {UserAccount, userAccountValidation}