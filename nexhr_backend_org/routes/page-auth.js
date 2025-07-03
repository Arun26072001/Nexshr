const express = require("express");
const { verifyAdmin } = require("../auth/authMiddleware");
const { pageAuthValidation, PageAuth } = require("../models/PageAuth");
const { errorCollector } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

router.post("/", verifyAdmin, async (req, res) => {
    try {
        const validation = pageAuthValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ error: error.details[0].message })
        } else {
            const newPageAuth = await PageAuth.create(req.body);
            res.send(newPageAuth._id)
        }
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ error: error.message })
    }
})

module.exports = router;