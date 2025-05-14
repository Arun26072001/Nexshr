const mongoose = require('mongoose');
const Joi = require('joi');

const attendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave'], required: true }
  });

  const Attendance = mongoose.model('Attendance', attendanceSchema);

  const AttendanceValidation = Joi.object({
    employee: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).label('Employee ID'),
    date: Joi.date().required().label('Date'),
    checkIn: Joi.date().required().label('Check-In Time'),
    checkOut: Joi.date().required().label('Check-Out Time'),
    status: Joi.string().valid('present', 'absent', 'leave').required().label('Status')
  });

  module.exports = {
    Attendance,
    AttendanceValidation
  }