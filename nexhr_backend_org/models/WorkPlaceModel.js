const mongoose = require('mongoose');
var Joi = require('joi');

const WorkPlaceSchema = mongoose.Schema({
  name: { type: String },
  timeZone: { type: mongoose.Schema.Types.ObjectId, ref: "Timezone" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
  Address_1: { type: String },
  Address_2: { type: String },
  Country: { type: String },
  State: { type: String },
  PostCode: { type: Number },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  Town: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

const WorkPlace = mongoose.model("WorkPlace", WorkPlaceSchema);

const WorkPlaceValidation = Joi.object().keys({
  _id: Joi.optional(),
  company: Joi.any().optional(),
  isDeleted: Joi.any().optional(),
  timeZone: Joi.any().optional(),
  Address_1: Joi.string()
    .disallow(null, '', 'none', 'undefined')
    .max(100)
    .required(),
  Address_2: Joi.string().optional(),
  Country: Joi.string().disallow(null, '', 'none', 'undefined').required(),
  State: Joi.string().disallow(null, '', 'none', 'undefined').required(),
  Town: Joi.string()
    .optional(),
  PostCode: Joi.number().integer().min(10000).max(999999).optional(),
  employees: Joi.optional(),
  _id: Joi.string().allow("").optional(),
  createdAt: Joi.string().allow('').label('createdAt'),
  updatedAt: Joi.string().allow('').label('updatedAt'),
  __v: Joi.string().allow(0).label('__v')
});

module.exports = {
  WorkPlace,
  WorkPlaceValidation,
  WorkPlaceSchema
}