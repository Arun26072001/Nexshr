var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var Joi = require('joi');

var roleSchema = new mongoose.Schema({
  RoleName: { type: String, required: true, unique: true },
  company: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }]
});

var Role = mongoose.model("Role", roleSchema);
// autoIncrement.initialize(mongoose.connection);
// roleSchema.plugin(autoIncrement.plugin, {
//   model: "Role",
//   field: "RoleID"
// });
const RoleValidation = Joi.object().keys({
  RoleName: Joi.string()
    .max(200)
    .required(),
  company: Joi.required()
});

module.exports = { Role, RoleValidation };

