const Joi = require('joi');
const mongoose = require('mongoose');

// Define the timeRange schema with givenTime and takenTime
const timeRangeSchema = new mongoose.Schema({
  startingTime: [{ type: Date }],
  endingTime: [{ type: Date }],
  timeHolder: { type: String }
}, { _id: false })

const timeRangeSchema1 = new mongoose.Schema({
  startingTime: [{ type: Date }],
  endingTime: [{ type: Date }],
  timeHolder: { type: String },
  reasonForLate: { type: String }
}, { _id: false })

const timeRangeSchema2 = new mongoose.Schema({
  startingTime: [{ type: Date }],
  endingTime: [{ type: Date }],
  timeHolder: { type: String },
  reasonForEarlyLogout: { type: String }
}, { _id: false })

// Define the main schema
const clockInsSchema = new mongoose.Schema({
  date: {
    type: Date
  },
  login: {
    type: timeRangeSchema2
  },
  meeting: {
    type: timeRangeSchema
  },
  morningBreak: {
    type: timeRangeSchema1
  },
  lunch: {
    type: timeRangeSchema1
  },
  eveningBreak: {
    type: timeRangeSchema1
  },
  event: {
    type: timeRangeSchema
  },
  isStopTimer: { type: Boolean, default: false },
  forgetToLogout: { type: String },
  behaviour: { type: String },
  punchInMsg: { type: String },
  employee: { type: mongoose.Types.ObjectId, ref: "Employee" },
  machineRecords: [{ type: String, default: [] }],
  worklocation: { type: String },
  isWorkingOverTime: {type: Boolean}
});

const ClockIns = mongoose.model('clockIns', clockInsSchema);

// Joi validation schema
const timeRangeValidate = Joi.object({
  startingTime: Joi.array().items(Joi.string().allow('')).allow(null).optional(),
  endingTime: Joi.array().items(Joi.string().allow('')).allow(null).optional(),
  timeHolder: Joi.string().allow('').optional(),
  reasonForLate: Joi.string().allow('').optional()
});

// Define the main validation schema
const clockInsValidation = Joi.object({
  date: Joi.date().required(), // Date is required
  login: timeRangeValidate.optional(),
  meeting: timeRangeValidate.optional(),
  morningBreak: timeRangeValidate.optional(),
  lunch: timeRangeValidate.optional(),
  eveningBreak: timeRangeValidate.optional(),
  event: timeRangeValidate.optional(),
  behaviour: Joi.string().optional(), // Behaviour is optional
  punchInMsg: Joi.string().optional(), // PunchInMsg is optional
  employee: Joi.string().optional(), // Employee ObjectId is required
  machineRecords: Joi.array().items(Joi.string()).optional()
});


module.exports = {
  ClockIns,
  clockInsValidation,
  clockInsSchema
};
