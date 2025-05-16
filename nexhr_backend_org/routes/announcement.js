const express = require('express');
const { Announcement, announcementValidation } = require('../models/AnnouncementModel');
const { verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');
const { sendPushNotification } = require('../auth/PushNotification');
const router = express.Router();

router.post('/:id', async (req, res) => {
  try {
    // Validate Request Body
    const { error } = announcementValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    // Fetch Tagged Employees (await added)
    const employees = await Employee.find(
      { _id: { $in: req.body.selectTeamMembers } },
      "FirstName LastName Email fcmToken company notifications"
    ).populate("company", "logo CompanyName");

    // Create New Announcement
    const newAnnouncement = {
      ...req.body,
      createdBy: req.params.id
    };

    const announcement = await Announcement.create(newAnnouncement);

    // Send Notifications (in parallel)
    if (employees?.length > 0) {
      await Promise.all(
        employees.map(async (emp) => {
          // Add Notification
          emp.notifications.push({
            company: emp?.company?._id,
            title: req.body.title,
            message: req.body.message.replace(/<\/?[^>]+(>|$)/g, '')
          });

          await emp.save();

          // Send Push Notification
          if (emp.fcmToken) {
            await sendPushNotification({
              token: emp.fcmToken,
              company: emp.company,
              title: req.body.title,
              body: req.body.message.replace(/<\/?[^>]+(>|$)/g, '')
            });
          }
        })
      );
    }

    res.status(201).json({
      message: 'Announcement created successfully!',
      data: announcement
    });

  } catch (error) {
    console.error("Error creating announcement:", error);
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

