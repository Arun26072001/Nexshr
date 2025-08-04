const mongoose = require('mongoose');
const Joi = require('joi');

var positionSchema = new mongoose.Schema({
  PositionName: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const PositionValidation = Joi.object().keys({
  _id: Joi.string().allow("").optional(),
  createdAt: Joi.string().allow('').label('createdAt'),
  updatedAt: Joi.string().allow('').label('updatedAt'),
  __v: Joi.string().allow(0).label('__v'),
  PositionName: Joi.string()
    .max(200)
    .required(),
  company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  isDeleted: Joi.any().optional()
});

var Position = mongoose.model("Position", positionSchema);

// const staticPositions = [
//   {
//     "company": {},
//     "PositionName": "Lead"
//   },
//   {
//     "company": {},
//     "PositionName": "Assosiate"
//   },
//   {
//     "company": {},
//     "PositionName": "Executive"
//   }
// ]

// Position.countDocuments().then(count => {
//   if (count === 0) {
//     Position.insertMany(staticPositions)
//       .then(() => console.log("Static Positions inserted!"))
//       .catch(err => console.error("Error inserting Positions:", err));
//   } else {
//     console.log("Positions already exist. Skipping static data insertion.");
//   }
// });

module.exports = { Position, PositionValidation, positionSchema };
