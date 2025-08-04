const express = require('express');
const router = express.Router();
const { Employee } = require('../models/EmpModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { RoleAndPermission } = require('../models/RoleModel');
const { userPermissionsValidation, UserPermission } = require('../models/UserPermissionModel');
const { PageAuth, pageAuthValidation } = require('../models/PageAuth');
const { errorCollector, checkValidObjId, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

// get role by roleName
router.get("/name", verifyAdminHR, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    const roleData = await RoleAndPermission.findOne({ RoleName: "Assosiate", company: companyId })
      .populate("userPermissions")
      .populate("pageAuth")
      .exec();

    if (!roleData) {
      return res.status(404).send({ error: "Data not found in given role" })
    } else {
      // let role = {
      //   RoleName: roleData?.RoleName,
      //   pageAuth: {
      //     Administration: roleData?.pageAuth?.Administration,
      //     Attendance: roleData?.pageAuth?.Attendance,
      //     Dashboard: roleData?.pageAuth?.Dashboard,
      //     Employee: roleData?.pageAuth?.Employee,
      //     JobDesk: roleData?.pageAuth?.JobDesk,
      //     Leave: roleData?.pageAuth?.Leave,
      //     Settings: roleData?.pageAuth?.Settings,
      //   },
      //   userPermissions: {
      //     Attendance: roleData?.userPermissions?.Attendance,
      //     Company: roleData?.userPermissions?.Company,
      //     Department: roleData?.userPermissions?.Department,
      //     Employee: roleData?.userPermissions?.Employee,
      //     Holiday: roleData?.userPermissions?.Holiday,
      //     Leave: roleData?.userPermissions?.Leave,
      //     Role: roleData?.userPermissions?.Role,
      //     TimePattern: roleData?.userPermissions?.TimePattern,
      //     WorkPlace: roleData?.userPermissions?.WorkPlace,
      //     Payroll: roleData?.userPermissions?.Payroll,
      //   }
      // }
      res.send(roleData);
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.log(error);
    return res.status(500).send({ error: error.message })
  }
})


// Get all roles
router.get('/', verifyAdminHREmployeeManagerNetwork, (req, res) => {
  const companyId = getCompanyIdFromToken(req.headers["authorization"]);
  if (!companyId) {
    return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
  }
  RoleAndPermission.find({ isDeleted: false, company: companyId })
    .populate("userPermissions")
    .populate("pageAuth")
    // .populate('company')
    .exec((err, roles) => {
      if (err) return res.status(403).send(err);
      else {
        return res.send(roles);
      }
    });
});

// Add new role
router.post('/', verifyAdminHR, async (req, res) => {
  const newRole = req.body;
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    delete newRole._id;
    delete newRole.userPermissions._id;
    delete newRole.pageAuth._id;

    // check role is already exists
    const isExists = await RoleAndPermission.exists({ RoleName: new RegExp(`^${newRole.RoleName}$`, "i") });
    if (isExists) {
      return res.status(400).send({ error: `${newRole.RoleName} role is already exists` })
    }

    // Validate userPermissions
    const { error: userPermissionsError } = userPermissionsValidation.validate(newRole.userPermissions);
    if (userPermissionsError) {
      return res.status(400).send({ error: userPermissionsError.details[0].message });
    }

    // // Validate pageAuth
    const { error: pageAuthError } = pageAuthValidation.validate(newRole.pageAuth);
    if (pageAuthError) {
      return res.status(400).send({ error: pageAuthError.details[0].message });
    }

    // Create and save user permissions and page authorization in the database
    const userPermission = await UserPermission.create(newRole.userPermissions);
    const pageAuth = await PageAuth.create(newRole.pageAuth);

    // Finalize new role data with references
    const finalRoleData = {
      RoleName: newRole.RoleName,
      userPermissions: userPermission._id,
      pageAuth: pageAuth._id,
      company: companyId
    };

    const role = await RoleAndPermission.create(finalRoleData);
    res.send({ message: `${role.RoleName} Role and permission has been added!` });
  } catch (error) {
    console.log("error in create new role", error)
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: error.message });
  }
});

// GET role by ID
router.get("/:id", verifyAdminHR, async (req, res) => {
  if (!checkValidObjId(req.params.id)) {
    return res.status(400).send({ error: "Invalid role ID" });
  }

  try {
    const role = await RoleAndPermission.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate("userPermissions")
      .populate("pageAuth")
      .exec();

    if (!role) {
      return res.status(404).send({ error: "Role not found" });
    }

    res.send(role);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    res.status(500).send({ error: error.message });
  }
});

// UPDATE role
router.put("/:id", verifyAdminHR, async (req, res) => {
  if (!checkValidObjId(req.params.id)) {
    return res.status(400).send({ error: "Invalid role ID" });
  }

  try {
    const updatedRole = req.body;

    // Update permissions
    const userPermission = await UserPermission.findByIdAndUpdate(
      updatedRole.userPermissions._id,
      updatedRole.userPermissions,
      { new: true }
    );

    const pageAuth = await PageAuth.findByIdAndUpdate(
      updatedRole.pageAuth._id,
      updatedRole.pageAuth,
      { new: true }
    );

    if (!userPermission || !pageAuth) {
      return res.status(404).send({ error: "User permissions or page authorization not found" });
    }

    const finalRoleData = {
      RoleName: updatedRole.RoleName,
      userPermissions: userPermission._id,
      pageAuth: pageAuth._id
    };

    const role = await RoleAndPermission.findByIdAndUpdate(
      req.params.id,
      finalRoleData,
      { new: true }
    );

    if (!role) {
      return res.status(404).send({ error: "Role not found" });
    }

    return res.send({ message: `${updatedRole.RoleName} Authorization has been updated!` });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    res.status(500).send({ error: error.message });
  }
});

// SOFT DELETE role
router.delete("/:id", verifyAdminHR, async (req, res) => {
  if (!checkValidObjId(req.params.id)) {
    return res.status(400).send({ error: "Invalid role ID" });
  }
  const companyId = getCompanyIdFromToken(req.headers["authorization"]);
  if (!companyId) {
    return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
  }

  try {
    const isEmpRole = await Employee.find({ role: { $in: req.params.id }, isDeleted: false, company: companyId }).lean();
    if (isEmpRole.length > 0) {
      return res.status(400).send({ message: "Please remove Employees from this role!" });
    }

    const roleData = await RoleAndPermission.findById(req.params.id);
    if (!roleData) {
      return res.status(404).send({ error: "Role not found" });
    }

    // Optional: Also soft delete permission and auth if needed
    await PageAuth.findByIdAndUpdate(roleData.pageAuth, { isDeleted: true });
    await UserPermission.findByIdAndUpdate(roleData.userPermissions, { isDeleted: true });

    await RoleAndPermission.findByIdAndUpdate(req.params.id, { isDeleted: true });

    return res.send({ message: `${roleData.RoleName} role has been soft-deleted successfully.` });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    res.status(500).send({ error: error.message });
  }
});
module.exports = router;
