const mongoose = require("mongoose");
const Joi = require('joi');

// Mongoose schema for permissions
const permissionSchema = new mongoose.Schema({
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
}, { _id: false });

const userPermissionsSchema = new mongoose.Schema({
    Attendance: permissionSchema,
    Company: permissionSchema,
    Department: permissionSchema,
    Employee: permissionSchema,
    Holiday: permissionSchema,
    Leave: permissionSchema,
    Role: permissionSchema,
    TimePattern: permissionSchema,
    WorkPlace: permissionSchema,
    Payroll: permissionSchema
});

const UserPermission = mongoose.model("UserPermission", userPermissionsSchema);

const staticUserPermissions = [
    {
        "_id": {
            "$oid": "6721fb52a3ed9a4ec05918a3"
        },
        "Attendance": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Company": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Department": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Employee": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Holiday": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Leave": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Role": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "TimePattern": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "WorkPlace": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Payroll": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        }
    },
    {
        "_id": {
            "$oid": "6721fb52a3ed9a4ec05918b4"
        },
        "Attendance": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": false
        },
        "Company": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "Department": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "Employee": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Holiday": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": false
        },
        "Leave": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Role": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "TimePattern": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "WorkPlace": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "Payroll": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        }
    },
    {
        "_id": {
            "$oid": "6721fb52a3ed9a4ec05918c5"
        },
        "Attendance": {
            "view": true,
            "edit": false,
            "add": true,
            "delete": false
        },
        "Company": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "Department": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "Employee": {
            "view": true,
            "edit": true,
            "add": false,
            "delete": false
        },
        "Holiday": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "Leave": {
            "view": true,
            "edit": true,
            "add": true,
            "delete": true
        },
        "Role": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "TimePattern": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "WorkPlace": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        },
        "Payroll": {
            "view": true,
            "edit": false,
            "add": false,
            "delete": false
        }
    }
]

UserPermission.countDocuments().then(count => {
    if (count === 0) {
      UserPermission.insertMany(staticUserPermissions)
        .then(() => console.log("Static userPermissions inserted!"))
        .catch(err => console.error("Error inserting userPermissions:", err));
    } else {
      console.log("UserPermissions already exist. Skipping static data insertion.");
    }
  });

// Joi validation schema
const permissionSchemaJoi = Joi.object({
    view: Joi.boolean().optional(),
    edit: Joi.boolean().optional(),
    add: Joi.boolean().optional(),
    delete: Joi.boolean().optional(),
});

const userPermissionsValidation = Joi.object({
    Attendance: permissionSchemaJoi,
    Company: permissionSchemaJoi,
    Department: permissionSchemaJoi,
    Employee: permissionSchemaJoi,
    Holiday: permissionSchemaJoi,
    Leave: permissionSchemaJoi,
    Role: permissionSchemaJoi,
    TimePattern: permissionSchemaJoi,
    WorkPlace: permissionSchemaJoi,
    Payroll: Joi.allow(null)
});

module.exports = { UserPermission, userPermissionsValidation }