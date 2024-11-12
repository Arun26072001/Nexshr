const mongoose = require("mongoose");

const userAccountSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    orgId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Organization" }],
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
})

const UserAccount = mongoose.model("UserAccount", userAccountSchema);

const userAccountValidationSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),  // Minimum 8 characters for password
    orgId: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(), // Valid MongoDB ObjectId
    createdAt: Joi.date().default(Date.now), // Automatically sets to current date if not provided
    expiresAt: Joi.date().greater(Joi.ref('createdAt')).optional() // Should be a date after createdAt
});

module.exports = {UserAccount, userAccountValidationSchema}