const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose schema for permissions
const permissionSchema = new mongoose.Schema({
    view: { type: Boolean, required: true },
    edit: { type: Boolean, required: true },
    add: { type: Boolean, required: true },
    delete: { type: Boolean, required: true }
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

const UserPermission = mongoose.model("userPermission", userPermissionsSchema);

// Joi validation schema
const permissionSchemaJoi = Joi.object({
    view: Joi.boolean().required(),
    edit: Joi.boolean().required(),
    add: Joi.boolean().required(),
    delete: Joi.boolean().required(),
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