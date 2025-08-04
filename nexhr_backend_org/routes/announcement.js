const express = require('express');
const { Announcement, announcementValidation } = require('../models/AnnouncementModel');
const { verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');
const { sendPushNotification } = require('../auth/PushNotification');
const { errorCollector, checkValidObjId, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');
const router = express.Router();

router.post('/:id', async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if(!companyId){
      return res.status(400).send({error: "You are not part of any company. Please check with your higher authorities."})
    }
    // check is valid id
    const { id } = req.params;
    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid or missing Employee Id" })
    }
    // Validate Request Body
    const { error } = announcementValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    // Fetch Tagged Employees (await added)
    const employees = await Employee.find(
      { _id: { $in: req.body.selectTeamMembers }, isDeleted: false },
      "FirstName LastName Email fcmToken company notifications"
    ).populate("company", "logo CompanyName");

    // Create New Announcement
    const newAnnouncement = {
      ...req.body,
      createdBy: req.params.id,
      company: companyId
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
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if(!companyId){
      return res.status(400).send({error: "You are not part of any company. Please check with your higher authorities."})
    }
    const announcements = await Announcement.find({ isDeleted: false, company: companyId });
    res.status(200).json({
      status: true,
      status_code: 200,
      Team: announcements
    });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
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
    // check is valid id
    const { id } = req.params;
    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid or missing Employee Id" })
    }

    // get annoucements from specify employee
    const notifications = await Announcement.find({ selectTeamMembers: req.params.id, isDeleted: false }).exec();
    const notViewAnnouncements = notifications.filter((item) => item?.whoViewed[req.params.id] === "not viewed")
    return res.send(notViewAnnouncements);
  } catch (error) {
    console.log("error in get employee annoucements", error);
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    // check is valid id
    const { id } = req.params;
    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid or missing Announcement Id" })
    }

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.send({ message: "message updated", announcement })
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
})

router.delete('/:announcementId', async (req, res) => {
  const { announcementId } = req.params;
  if (!checkValidObjId(announcementId)) {
    return res.status(400).send({ error: "Invalid or missing Announcement ID" })
  }
  try {
    const announcement = await Announcement.findById({ announcementId });
    if (!announcement) {
      return res.send({ message: "Announcement has been deleted successfully" });
    }
    const deletedAnnoucement = {
      ...announcement,
      isDelete: true
    }
    const updateData = await Announcement.findByIdAndUpdate(announcementId, deletedAnnoucement);
    return res.send({ message: "Announcement has been deleted successfully" })
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Error deleting announcement', details: error.message });
  }
});

module.exports = router;

