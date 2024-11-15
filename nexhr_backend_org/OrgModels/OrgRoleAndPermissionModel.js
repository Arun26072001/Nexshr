const mongoose = require("mongoose");

const OrgRoleAndPermissionSchemas = {};

function getRoleAndPermissionSchema(orgName) {
    if (!OrgRoleAndPermissionSchemas[orgName]) {
        OrgRoleAndPermissionSchemas[orgName] = new mongoose.Schema({
            RoleName: { type: String, unique: true },
            userPermissions: { type: mongoose.Schema.Types.ObjectId, ref: `${orgName}UserPermission` },
            pageAuth: { type: mongoose.Schema.Types.ObjectId, ref: `${orgName}PageAuth` }
        })
    }
    return OrgRoleAndPermissionSchemas[orgName];
}

const OrgRoleAndPermissionModels = {};

function getRoleAndPermissionModel(orgName) {
    if (!OrgRoleAndPermissionModels[orgName]) {
        OrgRoleAndPermissionModels[orgName] = mongoose.model(
            `${orgName}RoleAndPermission`,
            getRoleAndPermissionSchema(orgName)
        );
    }
    return OrgRoleAndPermissionModels[orgName];
}

const RoleAndPermissionValidation = Joi.object({
    RoleName: Joi.string().required().label("Role Name"),
    userPermissions: Joi.string().label("User Permissions"), // Ensure objectId extension if needed
    pageAuth: Joi.string().label("Page Authorization") // Ensure objectId extension if needed
});


module.exports = { getRoleAndPermissionModel, RoleAndPermissionValidation }
