const mongoose = require('mongoose');
const Joi = require('joi');

// Mongoose schema for permissions
const permissionSchema = new mongoose.Schema({
  view: { type: Boolean, required: true },
  edit: { type: Boolean, required: true },
  add: { type: Boolean, required: true },
  delete: { type: Boolean, required: true }
}, {_id: false});

const userPermissionsSchema = new mongoose.Schema({
  Attendance: permissionSchema,
  Company: permissionSchema,
  Department: permissionSchema,
  Employee: permissionSchema,
  Holiday: permissionSchema,
  Leave: permissionSchema,
  Role: permissionSchema,
  TimePattern: permissionSchema,
  WorkPlace: permissionSchema
}, { _id: false });

const pageAuthSchema = new mongoose.Schema({
  Administration: { type: String, required: true },
  Attendance: { type: String, required: true },
  Dashboard: { type: String, required: true },
  Employee: { type: String, required: true },
  JobDesk: { type: String, required: true },
  Leave: { type: String, required: true },
  Settings: { type: String, required: true }
}, { _id: false });

// Combine schemas into a main schema if needed
const RoleAndPermissionSchema = new mongoose.Schema({
  RoleName: { type: String },
  userPermissions: userPermissionsSchema,
  pageAuth: pageAuthSchema
});

// Create the model
const RoleAndPermission = mongoose.model('RoleAndPermission', RoleAndPermissionSchema);

// Joi validation schema
const permissionSchemaJoi = Joi.object({
  view: Joi.boolean().required(),
  edit: Joi.boolean().required(),
  add: Joi.boolean().required(),
  delete: Joi.boolean().required(),
});

const userPermissionsSchemaJoi = Joi.object({
  Attendance: permissionSchemaJoi,
  Company: permissionSchemaJoi,
  Department: permissionSchemaJoi,
  Employee: permissionSchemaJoi,
  Holiday: permissionSchemaJoi,
  Leave: permissionSchemaJoi,
  Role: permissionSchemaJoi,
  TimePattern: permissionSchemaJoi,
  WorkPlace: permissionSchemaJoi,
});

const pageAuthSchemaJoi = Joi.object({
  Administration: Joi.string().valid("allow", "not allow").required(),
  Attendance: Joi.string().valid("allow", "not allow").required(),
  Dashboard: Joi.string().valid("allow", "not allow").required(),
  Employee: Joi.string().valid("allow", "not allow").required(),
  JobDesk: Joi.string().valid("allow", "not allow").required(),
  Leave: Joi.string().valid("allow", "not allow").required(),
  Settings: Joi.string().valid("allow", "not allow").required(),
});

const RoleAndPermissionValidation = Joi.object({
  RoleName: Joi.string().required().label("RoleName"),
  userPermissions: userPermissionsSchemaJoi,
  pageAuth: pageAuthSchemaJoi,
});

// Export the model and the validation function
module.exports = {
  RoleAndPermission,
  RoleAndPermissionValidation
};
