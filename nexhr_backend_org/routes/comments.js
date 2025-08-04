const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Task } = require("../models/TaskModel");
const { commentValidation, Comment } = require("../models/CommentModel");
const sendMail = require("./mailSender");
const { checkValidObjId, errorCollector } = require("../Reuseable_functions/reusableFunction");
const { sendPushNotification } = require("../auth/PushNotification");
const { Employee } = require("../models/EmpModel");
const router = express.Router();

// get comments from the task
router.get("/task/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // check task is exists
        const task = await Task.findById(req.params.id, "title from to spend estTime comments status assignedTo")
            .populate("comments").lean().exec();
        if (!task) {
            return res.status(404).send({ error: "Task not found. Please verify or refresh the page and try again." })
        }
        return res.send(task);
    } catch (error) {
        console.log("error in fetch task's comments", error);
        return res.status(500).send({ error: error.message })
    }
})

// add comment
router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const taskId = req.params.id;
        if (!checkValidObjId(taskId)) {
            res.status(400).send({ error: `Invalid or missing task ID` })
        }
        // check task is exists
        const task = await Task.findById(taskId, "title comments assignedTo").exec();
        if (!task) {
            return res.status(404).send({ error: "Task not found. Please verify or refresh the page and try again." })
        }

        // get employee data for company data
        const assignessId = task.assignedTo || [];
        const emps = await Employee.find({ _id: { $in: assignessId } }, "FirstName LastName Email fcmToken profile company")
            .populate("company", "CompanyName logo")
            .exec();

        if (!emps || !emps.length) {
            return res.status(400).send({ error: "Assinees not found. Please verify or refresh the page and try again." })
        }
        const newComment = {
            ...req.body,
            date: new Date(),
            isDeleted: false,
        }
        // check comment validation
        const { error } = commentValidation.validate(newComment);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const commentCreator = await Employee.findById(newComment.createdBy, "FirstName LastName").lean().exec();
        if (!commentCreator) {
            return res.status(400).send({ error: "Employee not found. Please verify or refresh the page and try again." })
        }
        // comment create and add created comment in task
        const comment = await Comment.create(newComment);
        task.comments.push(comment._id);
        await task.save();

        // send mail and notification for task assignees
        if (emps?.length > 0) {
            emps.forEach((emp) => {
                const title = `${commentCreator.FirstName + " " + commentCreator.LastName} has commented in ${task.title}`;
                const message = newComment.comment.replace(/<\/?[^>]+(>|$)/g, '')
                // send mail 
                sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: emp.Email,
                    Subject: title,
                    TextBody: message
                })
                // send notification
                sendPushNotification({
                    token: emp.fcmToken,
                    title,
                    body: message,
                    type: "comment",
                    name: emp.FirstName
                })
            });
        }

        return res.send({ message: "comment has been added" })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log("error in add comment in task", error);
        return res.status(500).send({ error: error.message })
    }
})

// update comment
router.put("/:taskId/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // check url's id are exists
        const taskId = req.params.taskId;
        const commentId = req.params.id;
        if (!checkValidObjId(taskId) || !checkValidObjId(commentId)) {
            return res.status(400).send({ error: `Invalid or missing task ID` })
        }
        if (!checkValidObjId(commentId)) {
            return res.status(400).send({ error: `Invalid or missing comment ID` })
        }

        // check task is exists
        const task = await Task.findById(taskId, "comments")
            .populate("comments").lean().exec();
        if (!task) {
            return res.status(404).send({ error: "Task not found. Please verify or refresh the page and try again." })
        }
        // check validation for commentObj
        const updatedComment = req.body;
        const { error } = commentValidation.validate(updatedComment);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }

        // check old and updated comment attachements are same
        const comments = task.comments || [];
        const oldCommentObj = comments.find((comment) => String(comment._id) === commentId) || {};
        if (!oldCommentObj) {
            return res.status(400).send({ error: "comment not found, please recheck or refresh the page and try again" })
        }
        const deletedImgs = oldCommentObj.attachments.map((img) => {
            if (!updatedComment.attachments.includes(img)) {
                return img;
            }
        }).filter(Boolean);
        if (deletedImgs.length > 0) {
            const removedFiles = removeImgsFromServer(deletedImgs);
            console.log("removedfiles", removedFiles)
        }
        // update comment
        const updateComment = await Comment.findByIdAndUpdate(commentId, updatedComment, { new: true });
        return res.send({ message: "comment has been updated successfully", updateComment })
    } catch (error) {
        console.log("error in update comment", error)
        return res.status(500).send({ error: error.message });
    }
})

// delete comment
router.delete("/:taskId/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // check url's id are exists
        const taskId = req.params.taskId;
        const commentId = req.params.id;
        if (!checkValidObjId(taskId) || !checkValidObjId(commentId)) {
            return res.status(400).send({ error: `Invalid or missing task ID` })
        }
        if (!checkValidObjId(commentId)) {
            return res.status(400).send({ error: `Invalid or missing comment ID` })
        }

        // check task is exists
        const task = await Task.findById(taskId, "comments").exec();
        if (!task) {
            return res.status(404).send({ error: "Task not found. Please verify or refresh the page and try again." })
        }
        const comments = task.comments || [];

        // check comment is exists
        const comment = await Comment.findById(commentId).lean().exec();
        if (!comment) {
            return res.send({ message: "comment is deleted successfully" })
        }

        // update comment delete status and remove id from comments list in task
        const updatedComment = {
            ...comment,
            isDeleted: true
        }
        await Comment.findByIdAndUpdate(commentId, updatedComment);
        const filteredComments = comments.filter((comment) => String(comment) !== commentId);
        task.comments = filteredComments;
        await task.save();
        return res.send({ message: "comment is deleted successfully" })
    } catch (error) {
        console.log("error in delete comment", error)
        return res.status({ error: error.message })
    }
})

module.exports = router;