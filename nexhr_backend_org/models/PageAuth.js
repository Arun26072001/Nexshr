const mongoose = require("mongoose");
const Joi = require("joi");

const pageAuthSchema = new mongoose.Schema({
    Administration: { type: String, default: "not allow" },
    Attendance: { type: String, default: "not allow" },
    Dashboard: { type: String, default: "not allow" },
    Employee: { type: String, default: "not allow" },
    JobDesk: { type: String, default: "not allow" },
    Leave: { type: String, default: "not allow" },
    Settings: { type: String, default: "not allow" }
});

const PageAuth = mongoose.model("PageAuth", pageAuthSchema);

const staticPageAuths = [{
    "_id": {
        "$oid": "6721fcb7a3ed9a4ec05918b6"
    },
    "Administration": "allow",
    "Attendance": "allow",
    "Dashboard": "allow",
    "Employee": "allow",
    "JobDesk": "allow",
    "Leave": "allow",
    "Settings": "allow"
},
{
    "_id": {
        "$oid": "6721fcb7a3ed9a4ec05918c7"
    },
    "Administration": "not allow",
    "Attendance": "allow",
    "Dashboard": "allow",
    "Employee": "allow",
    "JobDesk": "allow",
    "Leave": "not allow",
    "Settings": "not allow"
},
{
    "_id": {
        "$oid": "6721fcb7a3ed9a4ec05918d8"
    },
    "Administration": "not allow",
    "Attendance": "not allow",
    "Dashboard": "allow",
    "Employee": "allow",
    "JobDesk": "allow",
    "Leave": "not allow",
    "Settings": "not allow"
}
]

PageAuth.countDocuments().then(count => {
    if (count === 0) {
        PageAuth.insertMany(staticPageAuths)
            .then(() => console.log("Static users inserted!"))
            .catch(err => console.error("Error inserting users:", err));
    } else {
        console.log("Users already exist. Skipping static data insertion.");
    }
});

const pageAuthValidation = Joi.object({
    Administration: Joi.string().optional(),
    Attendance: Joi.string().optional(),
    Dashboard: Joi.string().optional(),
    Employee: Joi.string().optional(),
    JobDesk: Joi.string().optional(),
    Leave: Joi.string().optional(),
    Settings: Joi.string().optional(),
});

module.exports = { PageAuth, pageAuthValidation, pageAuthSchema }