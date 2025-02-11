
const express = require('express');
const { Announcement, announcementValidation } = require('../models/AnnouncementModel');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { error } = announcementValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const newAnnouncement = new Announcement({ ...req.body });
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

