// const express = require("express");
// const { Org } = require("../OrgModels/OrganizationModel");
// const router = express.Router();
// const { verifySuperAdmin, verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
// const { UserAccount } = require("../OrgModels/UserAccountModel");
// const { RoleAndPermission } = require("../models/RoleModel");
// const { Employee } = require("../models/EmpModel");
// const sendMail = require("./mailSender");

// router.post("/:id", verifySuperAdmin, async (req, res) => {
//     try {
//         const { name, email, password, orgName, orgImg, entendValidity } = req.body;

//         // Check if organization or user already exists
//         const [orgExists, userExists] = await Promise.all([
//             Org.exists({ orgName }),
//             UserAccount.exists({ email }),
//         ]);

//         if (orgExists) return res.status(400).json({ error: "Organization name already exists" });
//         if (userExists) return res.status(400).json({ error: "User already exists" });

//         const now = new Date();
//         const expireAt = new Date();
//         expireAt.setFullYear(now.getFullYear() + 1); // Example: 1-year validity

//         // Create user 
//         const userData = await UserAccount.create({ name, email, password });
//         const orgData = await Org.create({
//             ...req.body,
//             createdAt: now,
//             expireAt,
//             createdBy: userData._id,
//             entendValidity,
//         })

//         // Find admin role
//         const adminRole = await RoleAndPermission.findOne({ RoleName: "Admin" }, "_id");

//         // Create employee record
//         const [firstName, lastName] = name.split(" ");
//         const employeeData = {
//             FirstName: firstName,
//             LastName: lastName || "",
//             Email: email,
//             Password: password,
//             role: adminRole._id,
//             annualLeaveEntitlement: 14,
//             employementType: "Full-time",
//         };

//         const addEmployee = await Employee.create(employeeData);

//         // Generate and send the email
//         const htmlContent = `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Welcome to ${orgData.orgName}</title>
//         </head>
//         <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
//           <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
//             <div style="text-align: center; padding: 20px;">
//               <img src="${orgImg}" alt="Logo" style="max-width: 100px;" />
//               <h1 style="margin: 10px 0; font-size: 24px;">Welcome to ${orgData.orgName}</h1>
//             </div>
//             <div style="margin: 20px 0;">
//               <p>Hello <strong>${addEmployee.FirstName} ${addEmployee.LastName}</strong>,</p>
//               <p><strong>Your credentials:</strong></p>
//               <p><strong>Email:</strong> ${addEmployee.Email}</p>
//               <p><strong>Password:</strong> ${addEmployee.Password}</p>
//               <p>You are now the admin for <strong>${orgData.orgName}</strong>. Please use the link below to log in:</p>
//               <a href="${process.env.FRONTEND_BASE_URL}" 
//                  style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">
//                  Confirm Email
//               </a>
//             </div>
//             <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
//               <p>If you have questions, contact our support team at 
//                  <a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a>.
//               </p>
//             </div>
//           </div>
//         </body>
//         </html>`;

//         sendMail({
//             From: process.env.FROM_MAIL,
//             To: email,
//             Subject: "Welcome to Nexshr",
//             HtmlBody: htmlContent,
//         });

//         res.status(201).json({
//             message: "Organization and admin user created successfully",
//             orgData,
//         });

//     } catch (err) {
//         console.error("Error creating organization:", err);
//         res.status(500).json({ error: err.message });
//     }
// });

// router.get("/", verifySuperAdmin, async (req, res) => {
//     try {
//         const orgs = await Org.find()
//             .populate("createdBy")
//             .exec();
//         if (orgs.length > 0) {
//             return res.send(orgs)
//         } else {
//             return res.status(200).send({ message: "No organizations found" });
//         }

//     } catch (error) {
//         console.log(error);
//         return res.status(500).send({ error: error.message })
//     }
// })

// router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
//     try {
//         const org = await Org.findById({ _id: req.params.id });
//         if (!org) {
//             res.status(404).send({ error: "Org not found in this id." })
//         } else {
//             res.send(org);
//         }
//     } catch (error) {
//         res.status(500).send({ error: error.message })
//     }
// });

// router.put("/:id", async (req, res) => {
//     try {
//         const isExists = await Org.findById(req.params.id);
//         // check is exists organization in db
//         if (!isExists) {
//             return res.status(404).send({ error: "Orgnanization not found" })
//         }
//         //updating organization
//         const updatedOrg = await Org.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         return res.send({ message: `${req.body.name} Organization update successfully`, updatedOrg })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).send({ error: error.message })
//     }
// })



// module.exports = router;