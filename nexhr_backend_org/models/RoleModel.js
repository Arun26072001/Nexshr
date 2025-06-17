const mongoose = require('mongoose');
const Joi = require('joi');

// Define the Mongoose schema
const RoleAndPermissionSchema = new mongoose.Schema({
  RoleName: { type: String, unique: true },
  userPermissions: { type: mongoose.Schema.Types.ObjectId, ref: "UserPermission" },
  pageAuth: { type: mongoose.Schema.Types.ObjectId, ref: "PageAuth" }
});

// Create the model
const RoleAndPermission = mongoose.model('RoleAndPermission', RoleAndPermissionSchema);

// const staticRoles = [
//   {
//     "RoleName": "Admin",
//     "__v": 0,
//     "pageAuth": {
//       "$oid": "6721fcb7a3ed9a4ec05918b6"
//     },
//     "userPermissions": {
//       "$oid": "6721fb52a3ed9a4ec05918a3"
//     }
//   },
//   {
//     "RoleName": "HR",
//     "__v": 0,
//     "pageAuth": {
//       "$oid": "6721fcb7a3ed9a4ec05918c7"
//     },
//     "userPermissions": {
//       "$oid": "6721fb52a3ed9a4ec05918b4"
//     }
//   },
//   {
//     "RoleName": "Associate",
//     "__v": 0,
//     "pageAuth": {
//       "$oid": "6721fcb7a3ed9a4ec05918d8"
//     },
//     "userPermissions": {
//       "$oid": "6721fb52a3ed9a4ec05918c5"
//     }
//   }
// ]

// RoleAndPermission.countDocuments().then(count => {
//   if (count === 0) {
//     RoleAndPermission.insertMany(staticRoles)
//       .then(() => console.log("Static RoleAndPermissions inserted!"))
//       .catch(err => console.error("Error inserting RoleAndPermissions:", err));
//   } else {
//     console.log("RoleAndPermissions already exist. Skipping static data insertion.");
//   }
// });

const RoleAndPermissionValidation = Joi.object({
  RoleName: Joi.string().required().disallow(null, '', 'none', 'undefined').label("Role Name"),
  userPermissions: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("User Permissions"), // Ensure objectId extension if needed
  pageAuth: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("Page Authorization") // Ensure objectId extension if needed
});

// Export the model and validation schema
module.exports = {
  RoleAndPermission,
  RoleAndPermissionValidation,
  RoleAndPermissionSchema
};
