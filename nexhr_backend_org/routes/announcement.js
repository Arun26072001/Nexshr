const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
// const admin = require('firebase-admin');

const router = express.Router();

// Schema and Model for Announcement
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  selectTeamMembers: [String],
  message: { type: String, required: true, trim: true },
  role: { type: String, required: true }
});
const Announcement = mongoose.model('Announcement', announcementSchema);

// Joi Validation Schema for Announcement
const announcementValidationSchema = Joi.object({
  title: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  message: Joi.string().required(),
  selectTeamMembers: Joi.array().items(Joi.string()),
  role: Joi.string().valid('1', '2').required()
});


// POST route to create an announcement
router.post('/', async (req, res) => {
  const { error, value } = announcementValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const newAnnouncement = new Announcement(value);
    const savedAnnouncement = await newAnnouncement.save();
    // Define the notification payload
    const message = {
      notification: {
        title: "New Announcement!",
        body: `Title: ${value.title}\nMessage: ${value.message}`,
      },
      topic: "loggedInUsers", // Topic to target all logged-in users
    };

    // Send the notification
    await messaging().send(message);
    res.status(201).json({ message: 'Announcement created and notification sent!', data: savedAnnouncement });
  } catch (err) {
    res.status(500).json({ error: "Internal error creating announcement", details: err.message });
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
