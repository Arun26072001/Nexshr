const mongoose = require('mongoose');
const Joi = require('joi');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    selectTeamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: [] }],
    message: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
const announcementValidation = Joi.object({
    title: Joi.string().required().label('title'),
    startDate: Joi.date().required().label('startDate'),
    endDate: Joi.date().required().label('endDate').min(Joi.ref('startDate')),
    message: Joi.string().required().label('message'),
    selectTeamMembers: Joi.array().items(Joi.string()).label("Selected members"),
    createdBy: Joi.string().required()
});

module.exports = { Announcement, announcementValidation }