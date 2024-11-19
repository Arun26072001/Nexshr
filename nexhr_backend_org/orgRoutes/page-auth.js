const express = require("express");
const { verifyAdmin } = require("../auth/authMiddleware");
const { pageAuthValidation, getPageAuthModel } = require("../OrgModels/OrgPageAuthModel");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { orgName } = jwt.decode(req.headers['authorization']);
        const OrgPageAuth =  getPageAuthModel(orgName)
        const validation = pageAuthValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ error: error.details[0].message })
        } else {
            const newPageAuth = await OrgPageAuth.create(req.body);
            res.send(newPageAuth._id)
        }
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

module.exports = router;