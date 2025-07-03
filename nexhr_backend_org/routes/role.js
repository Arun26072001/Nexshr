const express = require('express');
const router = express.Router();
const { Employee } = require('../models/EmpModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { RoleAndPermission } = require('../models/RoleModel');
const { userPermissionsValidation, UserPermission } = require('../models/UserPermissionModel');
const { PageAuth, pageAuthValidation } = require('../models/PageAuth');
const { errorCollector } = require('../Reuseable_functions/reusableFunction');

// get role by roleName
router.get("/name", verifyAdminHR, async (req, res) => {
  try {
    const roleData = await RoleAndPermission.findOne({ RoleName: "Assosiate" })
      .populate("userPermissions")
      .populate("pageAuth")
      .exec();
    if (!roleData) {
      res.status(404).send({ error: "Data not found in given role" })
    } else {
      let role = {
        RoleName: roleData?.RoleName,
        pageAuth: {
          Administration: roleData?.pageAuth?.Administration,
          Attendance: roleData?.pageAuth?.Attendance,
          Dashboard: roleData?.pageAuth?.Dashboard,
          Employee: roleData?.pageAuth?.Employee,
          JobDesk: roleData?.pageAuth?.JobDesk,
          Leave: roleData?.pageAuth?.Leave,
          Settings: roleData?.pageAuth?.Settings,
        },
        userPermissions: {
          Attendance: roleData?.userPermissions?.Attendance,
          Company: roleData?.userPermissions?.Company,
          Department: roleData?.userPermissions?.Department,
          Employee: roleData?.userPermissions?.Employee,
          Holiday: roleData?.userPermissions?.Holiday,
          Leave: roleData?.userPermissions?.Leave,
          Role: roleData?.userPermissions?.Role,
          TimePattern: roleData?.userPermissions?.TimePattern,
          WorkPlace: roleData?.userPermissions?.WorkPlace,
          Payroll: roleData?.userPermissions?.Payroll,
        }
      }
      res.send(role)
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.log(error);
    res.status(500).send({ error: error.message })
  }
})

// role get by id
router.get("/:id", verifyAdminHR, async (req, res) => {
  try {
    // const { orgName } = jwt.decode(req.headers['authorization']);
    // const RoleAndPermission = getRoleAndPermissionModel(orgName)
    const role = await RoleAndPermission.findById(req.params.id)
      .populate("userPermissions")
      .populate("pageAuth")
      .exec();
    if (!role) {
      res.status(404).send({ error: "Data not found in given ID" })
    } else {
      res.send(role);
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: error.message })
  }
});

// Get all roles
// router.get('/', verifyAdminHR, (req, res) => {
router.get('/', verifyAdminHREmployeeManagerNetwork, (req, res) => {
  // const { orgName } = jwt.decode(req.headers['authorization']);
  // const RoleAndPermission = getRoleAndPermissionModel(orgName)

  RoleAndPermission.find()
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

    // Validate userPermissions
    const { error: userPermissionsError } = userPermissionsValidation.validate(newRole.userPermissions);
    if (userPermissionsError) {
      return res.status(400).send({ error: userPermissionsError.details[0].message });
    }

    // Validate pageAuth
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
      pageAuth: pageAuth._id
    };
    // const { orgName } = jwt.decode(req.headers['authorization']);
    // const RoleAndPermission = getRoleAndPermissionModel(orgName)

    const role = await RoleAndPermission.create(finalRoleData);
    res.send({ message: `${role.RoleName} Role and permission has been added!` });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: error.message });
  }
});

// Update role
router.put('/:id', verifyAdminHR, async (req, res) => {
  try {
    const updatedRole = req.body;

    const updatedUserPermissions = {
      Attendance: updatedRole.userPermissions.Attendance,
      Company: updatedRole.userPermissions.Company,
      Department: updatedRole.userPermissions.Department,
      Employee: updatedRole.userPermissions.Employee,
      Holiday: updatedRole.userPermissions.Holiday,
      Leave: updatedRole.userPermissions.Leave,
      Role: updatedRole.userPermissions.Role,
      TimePattern: updatedRole.userPermissions.TimePattern,
      WorkPlace: updatedRole.userPermissions.WorkPlace,
      Payroll: updatedRole.userPermissions.Payroll,
    }

    // Validate userPermissions
    const { error: userPermissionsError } = userPermissionsValidation.validate(updatedUserPermissions);
    if (userPermissionsError) {
      return res.status(400).send({ error: userPermissionsError.details[0].message });
    }
    const updatedPageAuth = {
      Administration: updatedRole.pageAuth.Administration,
      Attendance: updatedRole.pageAuth.Attendance,
      Dashboard: updatedRole.pageAuth.Dashboard,
      Employee: updatedRole.pageAuth.Employee,
      JobDesk: updatedRole.pageAuth.JobDesk,
      Leave: updatedRole.pageAuth.Leave,
      Settings: updatedRole.pageAuth.Settings,
    }
    // Validate pageAuth
    const { error: pageAuthError } = pageAuthValidation.validate(updatedPageAuth);
    if (pageAuthError) {
      return res.status(400).send({ error: pageAuthError.details[0].message });
    }

    // Update user permissions and page authorization in the database
    const userPermission = await UserPermission.findByIdAndUpdate(
      updatedRole.userPermissions._id,
      updatedUserPermissions,
      { new: true }
    );
    const pageAuth = await PageAuth.findByIdAndUpdate(
      updatedRole.pageAuth._id,
      updatedPageAuth,
      { new: true }
    );

    if (!userPermission || !pageAuth) {
      return res.status(404).send({ error: "User permissions or page authorization not found" });
    }

    // Update role with references to updated user permissions and page authorization
    const finalRoleData = {
      RoleName: updatedRole.RoleName,
      userPermissions: updatedRole.userPermissions._id,
      pageAuth: updatedRole.pageAuth._id
    };
    // const { orgName } = jwt.decode(req.headers['authorization']);
    // const RoleAndPermission = getRoleAndPermissionModel(orgName)
    const role = await RoleAndPermission.findByIdAndUpdate(req.params.id, finalRoleData, { new: true });
    if (!role) {
      return res.status(404).send({ error: 'Role not found' });
    }

    return res.send({ message: `${updatedRole.RoleName} Authorization has been updated!` });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.log(error);
    return res.status(500).send({ error: error.message });
  }
});

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    const isEmpRole = await Employee.find({ role: { $in: req.params.id } });
    if (isEmpRole.length === 0) {
      const roleData = await RoleAndPermission.findById(req.params.id);
      // delete pageAuth and permission data from table
      await PageAuth.findByIdAndDelete(roleData.pageAuth);
      await UserPermission.findByIdAndDelete(roleData.userPermissions);

      const deleteRole = await RoleAndPermission.findByIdAndDelete(req.params.id);
      res.send({ message: `${deleteRole.RoleName} Role has been deleted` })
    } else {
      res.status(400).send({ message: "Please remove Employees from this role!" })
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: error.message })
  }
})

module.exports = router;

