const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var portalSchema = new mongoose.Schema({
    CreatedBy: { type: String },
    CreatedDate: { type: Date, default: Date.now },
    Deleted: { type: Boolean },
    ModifiedBy: { type: String },
    ModifiedDate: { type: Date },
    PortalName: { type: String, required: true },
    Status: { type: Number, required: true }
  });
  var Portal = mongoose.model("Portal", portalSchema);
  
  portalSchema.plugin(autoIncrement.plugin, {
    model: "Portal",
    field: "PortalID"
  });
  
  
  const PortalValidation = Joi.object().keys({
    _id: Joi.optional(),
    ID: Joi.optional(),
    CreatedBy: Joi.optional(),
    CreatedDate: Joi.optional(),
    Deleted: Joi.optional(),
    ModifiedBy: Joi.optional(),
    ModifiedDate: Joi.optional(),
    PortalName: Joi.string()
      .max(200)
      .required(),
    Status: Joi.number()
      .max(1)
      .required()
  });

  module.exports = {
    Portal, PortalValidation
  };