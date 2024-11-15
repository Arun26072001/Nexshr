// announcement.js
// const express = require('express');
// const mongoose = require('mongoose');
// const Joi = require('joi');
// const { messaging } = require('../firebase'); // Adjust the path as needed

// const router = express.Router();

// // Schema and Model for Announcement
// const announcementSchema = new mongoose.Schema({
//   title: { type: String, required: true, trim: true },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   selectTeamMembers: [String],
//   message: { type: String, required: true, trim: true },
//   role: { type: String, required: true }
// });

// const Announcement = mongoose.model('Announcement', announcementSchema);

// // Joi Validation Schema for Announcement
// const announcementValidationSchema = Joi.object({
//   title: Joi.string().required(),
//   startDate: Joi.date().required(),
//   endDate: Joi.date().required(),
//   message: Joi.string().required(),
//   selectTeamMembers: Joi.array().items(Joi.string()),
//   role: Joi.string().valid('1', '2').required()
// });
// // POST route to create an announcement
// router.post('/', async (req, res) => {
//   const { title, startDate, endDate, message, selectTeamMembers, role } = req.body;

//   // Validate the request body
//   const { error, value } = announcementValidationSchema.validate(req.body);
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message });
//   }

//   try {
//     // Create a new announcement
//     const newAnnouncement = new Announcement(value);
//     const savedAnnouncement = await newAnnouncement.save();

//     // Define the notification payload for Firebase
//     const firebaseMessage = {
//       notification: {
//         title: `Announcement: ${title}`,
//         body: `Title: ${title}\nMessage: ${message}`,
//       },
//       data: {
//         startDate: new Date(startDate).toISOString(),
//         endDate: new Date(endDate).toISOString(),
//         role: String(role),
//         selectTeamMembers: JSON.stringify(selectTeamMembers),
//       },
//       topic: "loggedInUsers", // Adjust the topic as needed
//     };

//     // Send Firebase notification
//     await messaging.send(firebaseMessage);

//     // Assuming sendChatNotification is a function defined elsewhere in your application
//     sendChatNotification(newAnnouncement);

//     res.status(201).json({
//       message: 'Announcement created, notifications sent!',
//       data: savedAnnouncement
//     });
//   } catch (error) {
//     console.error('Error creating announcement:', error);
//     res.status(500).json({ error: 'Error creating announcement', details: error.message });
//   }
// });

// module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');// Ensure the path is correct

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
  const { title, startDate, endDate, message, selectTeamMembers, role } = req.body;

  // Validate the request body
  const { error, value } = announcementValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Create a new announcement
    const newAnnouncement = new Announcement(value);
    const savedAnnouncement = await newAnnouncement.save();

    // Define the notification payload for Firebase
    const firebaseMessage = {
      notification: {
        title: `Announcement: ${title}`,
        body: `Title: ${title}\nMessage: ${message}`,
      },
      data: {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        role: String(role),
        selectTeamMembers: JSON.stringify(selectTeamMembers),
      },
      topic: "loggedInUsers" // Ensure this topic is correct
    };

    // // Send Firebase notification
    // if (messaging && typeof messaging.send === 'function') {
    //   await messaging.send(firebaseMessage);
    //   console.log('Notification sent successfully');
    // } else {
    //   console.error("Messaging service is not properly initialized.");
    //   return res.status(500).json({ error: 'Messaging service is not initialized.' });
    // }

    // Call sendChatNotification if it's defined
    if (typeof sendChatNotification === 'function') {
      sendChatNotification(newAnnouncement);
    }

    res.status(201).json({
      message: 'Announcement created and notifications sent!',
      data: savedAnnouncement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Error creating announcement', details: error.message });
  }
});
// GET route to retrieve all announcements
router.get('/', async (req, res) => {
  try {
    // Use .find() to get all announcements from the database
    const announcements = await Announcement.find();
    
    // Send the announcements with custom response structure
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
