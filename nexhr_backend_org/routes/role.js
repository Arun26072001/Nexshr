const express = require('express');
const router = express.Router();
const { Employee } = require('../models/EmpModel');
const { verifyAdminHR, verifyAdmin } = require('../auth/authMiddleware');
const { RoleAndPermission, RoleAndPermissionValidation } = require('../models/RoleModel');

// role get by id
router.get("/:id", verifyAdmin, async (req, res) => {
  try {
    const role = await RoleAndPermission.findById(req.params.id).exec();
    if (!role) {
      res.status(404).send({ error: "Data not found in given ID" })
    } else {
      res.send(role);
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// Get all roles
router.get('/', verifyAdminHR, (req, res) => {
  RoleAndPermission.find()
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
  const pages = [
    "Dashboard", "JobDesk", "Employee", "Leave",
    "Attendance", "Administration", "Settings"
  ];
  
  const actions = [
    { sNo: 1, action: "Leave" },
    { sNo: 2, action: "Attendance" },
    { sNo: 3, action: "WorkPlace" },
    { sNo: 4, action: "Role" },
    { sNo: 5, action: "Department" },
    { sNo: 6, action: "Holiday" },
    { sNo: 7, action: "Employee" },
    { sNo: 8, action: "Company" },
    { sNo: 9, action: "TimePattern" }
  ];
  
  const newRole = {
    RoleName: req.body?.RoleName || "",
    
    // Create userPermissions object with dynamic action names
    userPermissions: actions.reduce((acc, { action }) => {
      acc[action] = {
        view: req.body?.userPermissions?.[action]?.view || false,
        add: req.body?.userPermissions?.[action]?.add || false,
        edit: req.body?.userPermissions?.[action]?.edit || false,
        delete: req.body?.userPermissions?.[action]?.delete || false
      };
      return acc;
    }, {}),
    
    // Create pageAuth object with dynamic page names
    pageAuth: pages.reduce((acc, page) => {
      acc[page] = req.body?.pageAuth?.[page] || "not allow";
      return acc;
    }, {})
  };

  try {
    const validation = RoleAndPermissionValidation.validate(newRole);
    const { error } = validation;
    if (error) {
      res.status(400).send({ error: error.details[0].message })
    } else {
      const role = await RoleAndPermission.create(newRole);
      res.send({ message: `${newRole?.RoleName} Role and permission has been added!` })
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
});

// Update role
router.put('/:id', verifyAdminHR, async (req, res) => {
  const newRole = {
    RoleName: req.body.RoleName,
    pageAuth: req.body.pageAuth,
    userPermissions: req.body.userPermissions
  }

  try {
    const validation = RoleAndPermissionValidation.validate(newRole);
    const { error } = validation;
    if (error) {
      console.log(error);
      return res.status(400).send({ error: error.details[0].message });
    } else {
      const role = await RoleAndPermission.findByIdAndUpdate(req.params.id, newRole, { new: true });
      if (!role) {
        return res.status(404).send({ error: 'Role not found' });
      }
      return res.send({ message: `${newRole.RoleName} has been updated!` });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: error.message });
  }
});

// router.delete('/:id', verifyAdminHR, (req, res) => {
//   Employee.find({ role: req.params.id }, (err, employees) => {
//     if (err) {
//       return res.status(500).send(err);
//     }
//     if (employees.length === 0) {
//       Role.findByIdAndRemove(req.params.id, (err, role) => {
//         if (err) {
//           return res.status(500).send('Error deleting role');
//         }
//         return res.send(role);
//       });
//     } else {
//       return res.status(403).send('This role is associated with an employee and cannot be deleted');
//     }
//   });
// });

// Delete role
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const isEmpRole = await Employee.find({ role: { $in: req.params.id } });
    if (isEmpRole.length === 0) {
      const deleteRole = await RoleAndPermission.findByIdAndDelete(req.params.id);
      res.send({ message: "Role has been deleted!" })
    } else {
      res.status(400).send({ message: "Please remove Employees from this role!" })
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

module.exports = router;
