const express = require('express');
const { CompanyPolicy, CompanyPolicyValidation } = require('../models/CompanyPolicyModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { getCompanyIdFromToken, errorCollector, checkValidObjId } = require('../Reuseable_functions/reusableFunction');
const router = express.Router();

// Get company policy settings
router.get('/', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }

    let policy = await CompanyPolicy.findOne({ company: companyId })
      .populate('company', 'CompanyName logo')
      .lean();

    // If no policy exists, create default one
    if (!policy) {
      const defaultPolicy = new CompanyPolicy({ company: companyId });
      policy = await defaultPolicy.save();
      await policy.populate('company', 'CompanyName logo');
    }

    res.status(200).json({
      message: "Company policy settings retrieved successfully",
      policy
    });
  } catch (error) {
    await errorCollector({ 
      url: req.originalUrl, 
      name: error.name, 
      message: error.message, 
      env: process.env.ENVIRONMENT 
    });
    console.error('Error fetching company policy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update company policy settings (Admin/HR only)
router.put('/', verifyAdminHR, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }

    // Validate input
    const { error } = CompanyPolicyValidation.validate({ ...req.body, company: companyId });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Update or create policy
    const policy = await CompanyPolicy.findOneAndUpdate(
      { company: companyId },
      { ...req.body, company: companyId },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    ).populate('company', 'CompanyName logo');

    res.status(200).json({
      message: "Company policy settings updated successfully",
      policy
    });
  } catch (error) {
    await errorCollector({ 
      url: req.originalUrl, 
      name: error.name, 
      message: error.message, 
      env: process.env.ENVIRONMENT 
    });
    console.error('Error updating company policy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific policy section
router.get('/:section', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['attendance', 'leave', 'payroll', 'notifications', 'approval', 'system'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ error: "Invalid policy section" });
    }

    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }

    let policy = await CompanyPolicy.findOne({ company: companyId }).lean();
    
    // If no policy exists, create default one
    if (!policy) {
      const defaultPolicy = new CompanyPolicy({ company: companyId });
      policy = await defaultPolicy.save();
    }

    res.status(200).json({
      message: `${section} policy settings retrieved successfully`,
      [section]: policy[section]
    });
  } catch (error) {
    await errorCollector({ 
      url: req.originalUrl, 
      name: error.name, 
      message: error.message, 
      env: process.env.ENVIRONMENT 
    });
    console.error('Error fetching policy section:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update specific policy section
router.put('/:section', verifyAdminHR, async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['attendance', 'leave', 'payroll', 'notifications', 'approval', 'system'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ error: "Invalid policy section" });
    }

    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }

    // Prepare validation object
    const validationObj = { company: companyId, [section]: req.body };
    const { error } = CompanyPolicyValidation.validate(validationObj);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Update specific section
    const updateObj = { [`${section}`]: req.body };
    const policy = await CompanyPolicy.findOneAndUpdate(
      { company: companyId },
      { $set: updateObj },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    ).populate('company', 'CompanyName logo');

    res.status(200).json({
      message: `${section} policy settings updated successfully`,
      policy
    });
  } catch (error) {
    await errorCollector({ 
      url: req.originalUrl, 
      name: error.name, 
      message: error.message, 
      env: process.env.ENVIRONMENT 
    });
    console.error('Error updating policy section:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset policy settings to default
router.post('/reset', verifyAdminHR, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }

    // Delete existing policy and create new default one
    await CompanyPolicy.findOneAndDelete({ company: companyId });
    
    const defaultPolicy = new CompanyPolicy({ company: companyId });
    const policy = await defaultPolicy.save();
    await policy.populate('company', 'CompanyName logo');

    res.status(200).json({
      message: "Company policy settings reset to default successfully",
      policy
    });
  } catch (error) {
    await errorCollector({ 
      url: req.originalUrl, 
      name: error.name, 
      message: error.message, 
      env: process.env.ENVIRONMENT 
    });
    console.error('Error resetting company policy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get policy templates/presets
router.get('/templates/list', verifyAdminHR, async (req, res) => {
  try {
    const templates = {
      strict: {
        name: "Strict Policy",
        description: "High compliance with strict attendance and leave policies",
        attendance: {
          monthlyPermissionLimit: 1,
          permissionHourLimit: 60,
          lateLoginPenaltyThreshold: 120,
          defaultStartTime: "09:00"
        },
        leave: {
          teamLeaveLimit: 1,
          teamWfhLimit: 1,
          sickLeaveAdvanceApplication: false,
          casualLeaveAdvanceApplication: true
        }
      },
      flexible: {
        name: "Flexible Policy",
        description: "Employee-friendly with relaxed policies",
        attendance: {
          monthlyPermissionLimit: 4,
          permissionHourLimit: 180,
          lateLoginPenaltyThreshold: 360,
          defaultStartTime: "10:00"
        },
        leave: {
          teamLeaveLimit: 3,
          teamWfhLimit: 3,
          sickLeaveAdvanceApplication: true,
          casualLeaveAdvanceApplication: false
        }
      },
      balanced: {
        name: "Balanced Policy",
        description: "Balanced approach between compliance and flexibility",
        attendance: {
          monthlyPermissionLimit: 2,
          permissionHourLimit: 120,
          lateLoginPenaltyThreshold: 240,
          defaultStartTime: "09:30"
        },
        leave: {
          teamLeaveLimit: 2,
          teamWfhLimit: 2,
          sickLeaveAdvanceApplication: true,
          casualLeaveAdvanceApplication: false
        }
      }
    };

    res.status(200).json({
      message: "Policy templates retrieved successfully",
      templates
    });
  } catch (error) {
    await errorCollector({ 
      url: req.originalUrl, 
      name: error.name, 
      message: error.message, 
      env: process.env.ENVIRONMENT 
    });
    console.error('Error fetching policy templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply policy template
// router.post('/templates/:templateName', verifyAdminHR, async (req, res) => {
//   try {
//     const { templateName } = req.params;
//     const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    
//     if (!companyId) {
//       return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
//     }

//     // Get template data (you could move this to a separate service)
//     const templates = {
//       strict: {
//         attendance: {
//           monthlyPermissionLimit: 1,
//           permissionHourLimit: 60,
//           lateLoginPenaltyThreshold: 120,
//           permissionGrantDuration: 1,
//           warningLimit: 2,
//           overtimeLimit: 10,
//           workingHoursPerDay: 9
//         },
//         leave: {
//           teamLeaveLimit: 1,
//           teamWfhLimit: 1,
//           sickLeaveAdvanceApplication: false,
//           casualLeaveAdvanceApplication: true
//         }
//       },
//       flexible: {
//         attendance: {
//           monthlyPermissionLimit: 4,
//           permissionHourLimit: 180,
//           lateLoginPenaltyThreshold: 360,
//           permissionGrantDuration: 3,
//           warningLimit: 5,
//           overtimeLimit: 14,
//           workingHoursPerDay: 8
//         },
//         leave: {
//           teamLeaveLimit: 3,
//           teamWfhLimit: 3,
//           sickLeaveAdvanceApplication: true,
//           casualLeaveAdvanceApplication: false
//         }
//       },
//       balanced: {
//         attendance: {
//           monthlyPermissionLimit: 2,
//           permissionHourLimit: 120,
//           lateLoginPenaltyThreshold: 240,
//           permissionGrantDuration: 2,
//           warningLimit: 3,
//           overtimeLimit: 12,
//           workingHoursPerDay: 8
//         },
//         leave: {
//           teamLeaveLimit: 2,
//           teamWfhLimit: 2,
//           sickLeaveAdvanceApplication: true,
//           casualLeaveAdvanceApplication: false
//         }
//       }
//     };

//     if (!templates[templateName]) {
//       return res.status(400).json({ error: "Invalid template name" });
//     }

//     const templateData = templates[templateName];
    
//     // Apply template to company policy
//     const policy = await CompanyPolicy.findOneAndUpdate(
//       { company: companyId },
//       { ...templateData, company: companyId },
//       { 
//         new: true, 
//         upsert: true,
//         runValidators: true
//       }
//     ).populate('company', 'CompanyName logo');

//     res.status(200).json({
//       message: `${templateName} policy template applied successfully`,
//       policy
//     });
//   } catch (error) {
//     await errorCollector({ 
//       url: req.originalUrl, 
//       name: error.name, 
//       message: error.message, 
//       env: process.env.ENVIRONMENT 
//     });
//     console.error('Error applying policy template:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

module.exports = router;
