const express = require('express');
const { Announcement, announcementValidation } = require('../models/AnnouncementModel');
const { verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const router = express.Router();

router.post('/:id', async (req, res) => {
  try {
    const whoViewed = req.body.selectTeamMembers.reduce((acc, emp) => {
      acc[emp] = "not viewed";
      return acc;
    }, {});

    const newAnnouncement = {
      ...req.body,
      whoViewed,
      createdBy: req.params.id
    }

    const { error } = announcementValidation.validate(newAnnouncement);

    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const announcement = await Announcement.create(newAnnouncement);

    res.status(201).json({
      message: 'Announcement created successfully!',
      data: announcement
    });
  } catch (error) {
    console.error("20", error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
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

// fetch employee of notifications
router.get("/emp/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const notifications = await Announcement.find({ selectTeamMembers: req.params.id }).exec();
    const notViewAnnouncements = notifications.filter((item) => item?.whoViewed[req.params.id] === "not viewed")
    if (notViewAnnouncements.length === 0) {
      return res.status(200).send([])
    } else {
      return res.send(notViewAnnouncements);
    }
  } catch (error) {
    console.log(error);

    return res.status(500).send({ error: error.message })
  }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.send({ message: "message updated" })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

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

