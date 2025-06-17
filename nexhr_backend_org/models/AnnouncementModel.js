const mongoose = require('mongoose');
const Joi = require('joi');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    selectTeamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: [] }],
    message: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    // whoViewed: {type: mongoose.Schema.Types.Mixed}
});

const Announcement = mongoose.model('Announcement', announcementSchema);
const announcementValidation = Joi.object({
    title: Joi.string().required().disallow(null, '', 'none', 'undefined').label('title'),
    startDate: Joi.date().required().label('startDate'),
    endDate: Joi.date().required().label('endDate').min(Joi.ref('startDate')),
    message: Joi.string().required().disallow(null, '', 'none', 'undefined').label('message'),
    selectTeamMembers: Joi.array().items(Joi.string()).label("Selected members"),
    createdBy: Joi.any().optional(),
});

module.exports = { Announcement, announcementValidation, announcementSchema }