const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Joi = require('joi');

var projectSchema = new mongoose.Schema({
    CreatedBy: { type: String },
    CreatedDate: { type: Date, default: Date.now },
    Deleted: { type: Boolean },
    EmpFullName: { type: String },
    EstimatedCost: { type: Number },
    EstimatedTime: { type: Number },
    ModifiedBy: { type: String },
    ModifiedDate: { type: Date },
    ProjectDesc: { type: String },
    ProjectTitle: { type: String, required: true },
    ProjectURL: { type: String },
    Remark: { type: String },
    ResourceID: { type: Number },
    Status: { type: Number, required: true },
    /////////////****************** */
    // PortalName: { type: String },
    // Portals: 2
    /////////////****************** */
    portals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portal" }]
  });
  projectSchema.plugin(autoIncrement.plugin, {
    model: "Project",
    field: "ID"
  });
  
  var Project = mongoose.model("Project", projectSchema);
  
  const ProjectValidation = Joi.object().keys({
    _id: Joi.optional(),
    ID: Joi.optional(),
    CreatedBy: Joi.optional(),
    CreatedDate: Joi.optional(),
    Deleted: Joi.optional(),
    EmpFullName: Joi.string()
      .max(200)
      .optional(),
    EstimatedCost: Joi.optional(),
    EstimatedTime: Joi.optional(),
    ModifiedBy: Joi.optional(),
    ModifiedDate: Joi.optional(),
    ProjectDesc: Joi.string()
      .max(2000)
      .optional(),
    ProjectTitle: Joi.string()
      .max(200)
      .required(),
    ProjectURL: Joi.string()
      .max(1000)
      .optional(),
    Remark: Joi.string()
      .max(2000)
      .optional(),
    ResourceID: Joi.optional(),
    Status: Joi.number()
      .max(10)
      .required(),
    portal: Joi.optional(),
    Portal_ID: Joi.optional()
  });

  module.exports = {
    Project,ProjectValidation
  };