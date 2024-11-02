const mongoose = require('mongoose');
const Joi = require('joi');

// Define the Mongoose schema
const RoleAndPermissionSchema = new mongoose.Schema({
  RoleName: { type: String, required: true },
  userPermissions: { type: mongoose.Schema.Types.ObjectId, ref: "UserPermission" },
  pageAuth: { type: mongoose.Schema.Types.ObjectId, ref: "PageAuth" }
});

// Create the model
const RoleAndPermission = mongoose.model('RoleAndPermission', RoleAndPermissionSchema);

// Define Joi validation schema
// Ensure userPermissionsSchemaJoi and pageAuthSchemaJoi are defined or imported
const RoleAndPermissionValidation = Joi.object({
  RoleName: Joi.string().required().label("Role Name"),
  userPermissions: Joi.string().label("User Permissions"), // Ensure objectId extension if needed
  pageAuth: Joi.string().label("Page Authorization") // Ensure objectId extension if needed
});

// Export the model and validation schema
module.exports = {
  RoleAndPermission,
  RoleAndPermissionValidation
};
