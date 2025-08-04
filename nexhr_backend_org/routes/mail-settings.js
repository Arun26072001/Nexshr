const express = require("express");
const { verifySuperAdmin } = require("../auth/authMiddleware");
const EmailConfig = require("../models/EmailConfigModel");
const { errorCollector } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

// get mail settings data
router.get("/", verifySuperAdmin, async (req, res) => {
    try {
        const settings = await EmailConfig.find({isDeleted:false}).exec();
        return res.status(200).send(settings)
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        return res.status(500).send({ error: error.messaeg })
    }
})

router.put("/:id", verifySuperAdmin, async (req, res) => {
    try {
        // check is valid id
        const { id } = req.params;
        if (!checkValidObjId(id)) {
            return res.status(400).send({ error: "Invalid or missing EmailSettings Id" })
        }
        const settings = await EmailConfig.updateMany({ _id: { $nin: id } }, { $set: { isActive: false } });
        const updatedSetting = await EmailConfig.findByIdAndUpdate(id, req.body, { new: true });
        return res.send({ message: "Email settings updated successfully", updatedSetting })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;