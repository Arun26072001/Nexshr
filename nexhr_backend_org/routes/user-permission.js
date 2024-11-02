const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("../auth/authMiddleware");
const { userPermissionsValidation, UserPermission } = require("../models/UserPermissionModel");

router.post("/", verifyAdmin, async (req, res) => {
    try {
        const validation = userPermissionsValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ error: error.details[0].message })
        } else {
            const newUserPermission = await UserPermission.create(req.body);
            res.send(newUserPermission._id)
        }
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

module.exports = router;