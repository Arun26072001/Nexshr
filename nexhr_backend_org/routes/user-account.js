// const express = require("express");
// const { UserAccount, userAccountValidation } = require("../OrgModels/UserAccountModel");
// const { verifySuperAdmin } = require("../auth/authMiddleware");
// const router = express.Router();

// // should to add middleware for paid(membership)?
// router.post("/", async (req, res) => {
//     try {
//         const validation = userAccountValidation.validate(req.body);
//         const { error } = validation;
//         if (error) {
//             res.status(400).send({ error: error.details[0].message })
//         } else {
//             const addAccount = await UserAccount.create(req.body);
//             res.send({ message: "User account has been created", account: addAccount })
//         }
//     } catch (error) {
await errorCollector({url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT})
//         console.log(error);
//         res.status(500).send({ error: error.message })
//     }
// })

// router.get("/", verifySuperAdmin, async (req, res) => {
//     try {
//         const users = await UserAccount.find().exec();
//         console.log(users);
        
//         return res.send(users);
//     } catch (error) {
await errorCollector({url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT})
//         return res.status(500).send({ error: error.message })
//     }
// })

// module.exports = router;