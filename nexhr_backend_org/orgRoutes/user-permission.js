const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("../auth/authMiddleware");
const { userPermissionsValidation, UserPermission } = require("../models/UserPermissionModel");
const { getUserPermissionModel } = require("../OrgModels/OrgUserPermissionModel");

router.post("/", verifyAdmin, async (req, res) => {
    try {
        const validation = userPermissionsValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ error: error.details[0].message })
        } else {
            const { orgName } = jwt.decode(req.headers['authorization']);
            const orgUserPermission = getUserPermissionModel(orgName);
            const newUserPermission = await orgUserPermission.create(req.body);
            res.send(newUserPermission._id)
        }
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

module.exports = router;