const mongoose = require('mongoose');
const Joi = require('joi');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    selectTeamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: [] }],
    message: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
});

const Announcement = mongoose.model('Announcement', announcementSchema);
const announcementValidation = Joi.object({
    title: Joi.string().required().disallow(null, ' ', 'none', 'undefined').label('title'),
    startDate: Joi.date().required().label('startDate'),
    endDate: Joi.date().required().label('endDate').min(Joi.ref('startDate')).messages({
        "date.min": "'endDate' must be greater than 'fromDate'"
    }),
    message: Joi.string().required().disallow(null, ' ', 'none', 'undefined', '<p><br></p>').label('message'),
    selectTeamMembers: Joi.array().min(1).items(Joi.string()).label("selectTeamMembers").required(),
    createdBy: Joi.any().optional(),
});

module.exports = { Announcement, announcementValidation, announcementSchema }