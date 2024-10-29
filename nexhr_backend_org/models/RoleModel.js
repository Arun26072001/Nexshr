var mongoose = require('mongoose');
var Joi = require('joi');

const actionAuthSchema = new mongoose.Schema({
  name: {type: String},
  toView: {type: Boolean},
  toEdit: {type: Boolean},
  toAdd: {type: Boolean},
  toDelete: {type: Boolean}
}, {_id: false})

var roleSchema = new mongoose.Schema({
  RoleName: { type: String, required: true, unique: true },
  company: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
  pageAuth: {type: mongoose.Schema.Types.Mixed},
  actionAuth: actionAuthSchema
});

var Role = mongoose.model("Role", roleSchema);

const RoleValidation = Joi.object().keys({
  RoleName: Joi.string()
    .max(200)
    .required(),
  company: Joi.required()
});

module.exports = { Role, RoleValidation };

