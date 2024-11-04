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
    Payroll: permissionSchemaJoi
});

module.exports = { UserPermission, userPermissionsValidation }