const express = require("express");
const { verifyAdminHR } = require("../auth/authMiddleware");
const { EmailtempValidation, EmailTemplate } = require("../models/EmailTemplateModel");
const router = express.Router();

// add email template
router.post("/:id", verifyAdminHR, async (req, res) => {
    try {
        const newTemp = {
            ...req.body,
            createdBy: req.params.id
        }
        // check validation for new template
        const { error } = EmailtempValidation.validate(newTemp)
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        // add email template
        const addTemp = await EmailTemplate.create(newTemp);
        return res.send({ message: `${addTemp.title} email template created successfully` })
    } catch (error) {
        console.log("error in add email temp", error);
        return res.status(500).send({ error: error.message })
    }
})

// get all email templates
router.get("/", verifyAdminHR, async (req, res) => {
    try {
        const templates = await EmailTemplate.find().lean().exec();
        return res.send(templates);
    } catch (error) {
        console.log("error in fetch templates", error);
        return res.status(500).send({ error: error.message })
    }
})

router.put("/:id", verifyAdminHR, async (req, res) => {
    try {
        // check is exist try to update template
        const template = await EmailTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).send({ error: "Template not found" })
        }
        const updatedTemp = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.send({ message: `${updatedTemp.title} has been updated successfully` })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;