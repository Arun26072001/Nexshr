const mongoose = require("mongoose")

const UserPermissionSchemas = {};

function getUserPermissionSchema(orgName) {
    if (!UserPermissionSchemas[orgName]) {
        const permissionSchema = new mongoose.Schema({
            view: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            add: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        }, { _id: false });

        UserPermissionSchemas[orgName] = new mongoose.Schema({
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
        })
    }
    return UserPermissionSchemas[orgName];
}

const UserPermissionModels = {};

function getUserPermissionModel(orgName) {
    if (!UserPermissionModels[orgName]) {
        UserPermissionModels[orgName] = mongoose.model(
            `${orgName}UserPermission`,
            getUserPermissionSchema(orgName)
        );
    }
    return UserPermissionModels[orgName];
}

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

module.exports = { getUserPermissionModel, userPermissionsValidation }