const express = require("express");
const { UserAccount, userAccountValidation } = require("../OrgModels/UserAccountModel");
const { verifySuperAdmin } = require("../auth/authMiddleware");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtKey = process.env.ACCCESS_SECRET_KEY;

// should to add middleware for paid(membership)?
router.post("/", async (req, res) => {
    try {
        const validation = userAccountValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ error: error.details[0].message })
        } else {
            const addAccount = await UserAccount.create(req.body);
            res.send({ message: "User account has been created", account: addAccount })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message })
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const getAccount = await UserAccount.findOne({ email, password });

        const userAccountData = {
            accountId: getAccount._id,
            Account: getAccount.Account,
            expiresAt: getAccount.expiresAt,
            email: getAccount.email,
            name: getAccount.name
        }
        
        const token = jwt.sign(userAccountData, jwtKey)
        if (!getAccount) {
            res.status(400).send({ error: "Invalid email or password" })
        } else {
            return res.send(token);
        }
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

module.exports = router;