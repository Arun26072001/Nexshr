
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');

const router = express.Router();

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  selectTeamMembers: [String],
  message: { type: String, required: true, trim: true },
  role: { type: String, required: true },
  announcementId: { type: Number, required: true, unique: true }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true }
});

const Counter = mongoose.model('Counter', counterSchema);

const announcementValidationSchema = Joi.object({
  title: Joi.string().required().label('title'),
  startDate: Joi.date().required().label('startDate'),
  endDate: Joi.date().required().label('endDate').min(Joi.ref('startDate')),
  message: Joi.string().required().label('message'),
  selectTeamMembers: Joi.array().items(Joi.string()),
  role: Joi.string().valid('1', '2').required()
});

async function initializeCounter() {
  const counter = await Counter.findOne({ name: 'announcementId' });
  if (!counter) {
    await new Counter({ name: 'announcementId', value: 1 }).save();
  }
}

initializeCounter();

async function getNextAnnouncementId() {
  while (true) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'announcementId' },
      { $inc: { value: 1 } },
      { new: true }
    );


    const existingAnnouncement = await Announcement.findOne({ announcementId: counter.value });
    if (!existingAnnouncement) {
      return counter.value;
    }
  }
}


router.post('/', async (req, res) => {

  try {
    const { error } = announcementValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    const announcementId = await getNextAnnouncementId();

    const newAnnouncement = new Announcement({ ...req.body, announcementId });
    const savedAnnouncement = await newAnnouncement.save();

    res.status(201).json({
      message: 'Announcement created successfully!',
      data: savedAnnouncement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Error creating announcement', details: error.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.status(200).json({
      status: true,
      status_code: 200,
      Team: announcements
    });
  } catch (error) {
    console.error('Error retrieving announcements:', error);
    res.status(500).json({
      error: 'Error retrieving announcements',
      details: error.message
    });
  }
});


router.delete('/:announcementId', async (req, res) => {
  const { announcementId } = req.params;

  try {
    const result = await Announcement.findOneAndDelete({ announcementId });
    if (!result) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Error deleting announcement', details: error.message });
  }
});

module.exports = router;




// const express = require('express');
// const User = require("../models/users"); // User model for announcements

// const router = express.Router();

// // Middleware to check if the user is Admin or HR
// const checkAdminOrHR = (req, res, next) => {
//     const userRole = req.body.role; // Assuming role is part of the request body or fetched from authentication

//     if (userRole === 'Admin' || userRole === 'HR') {
//         next(); // Proceed if the user is an Admin or HR
//     } else {
//         return res.status(403).json({ error: 'Unauthorized: Only Admin or HR can send announcements.' });
//     }
// };

// // POST method to create an announcement
// router.post('/announcement', checkAdminOrHR, async (req, res) => {
//     const { title, startDate, endDate, message, selectTeamMembers, role } = req.body;

//     try {
//         // Create a new announcement
//         const newAnnouncement = new User({
//             title,
//             startDate,
//             endDate,
//             message,
//             selectTeamMembers,
//             role
//         });

//         await newAnnouncement.save();

//         // Send chat notification
//         sendChatNotification(newAnnouncement);

//         res.status(201).json({ message: 'Announcement created and messages sent!', newAnnouncement });
//     } catch (error) {
//         console.error('Error creating announcement:', error);
//         res.status(500).json({ error: 'Error creating announcement', details: error.message });
//     }
// });

// module.exports = router;
