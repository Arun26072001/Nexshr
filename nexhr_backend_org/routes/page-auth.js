const express = require("express");
const { verifyAdmin } = require("../auth/authMiddleware");
const { pageAuthValidation, PageAuth } = require("../models/PageAuth");
const { errorCollector } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

// router.get("/add-pages", async (req, res) => {
//     try {
//         const addPages = await PageAuth.find().exec();
//         const newPages = {
//             Task: "not allow",
//             Announcement: "not allow",
//             Project: "not allow",
//             Report: "not allow"
//         }
//         addPages.forEach(async (item) => {
//             const updatedPageAuth = {
//                 ...item,
//                 ...newPages
//             }
//             await PageAuth.findByIdAndUpdate(item._id, updatedPageAuth)
//         })
//         return res.send({ message: "pages has been add for all collection" })
//     } catch (error) {
//         console.log("error in add page", error)
//         return res.status(500).send({ error: error.message })
//     }
// })
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