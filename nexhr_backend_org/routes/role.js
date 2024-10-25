const express = require('express');
const router = express.Router();
const {Role, RoleValidation} = require('../models/RoleModel');
const Employee = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');

// Replace with your JWT key
const jwtKey = process.env.ACCCESS_SECRET_KEY ;

// Get all roles
router.get('/', verifyAdminHR, (req, res) => {
  Role.find()
    .populate('company')
    .exec((err, roles) => {
      if (err) return res.status(403).send(err);
      else {
        return res.send(roles);
      }
    });
});

// Add new role
router.post('/', verifyAdminHR,(req, res) => {
  Joi.validate(req.body, RoleValidation, (err, result) => {
    if (err) {
      return res.status(400).send(err.details[0].message);
    }

    const newRole = {
      RoleName: req.body.RoleName,
      company: req.body.company,
    };

    Role.create(newRole, (err, role) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }else {
        res.send("role has been added!")
      }
      
    });
  });
});

// Update role
router.put('/:id', verifyAdminHR, (req, res) => {
  Joi.validate(req.body, RoleValidation, (err, result) => {
    if (err) {
      return res.status(400).send(err.details[0].message);
    }

    const updateRole = {
      RoleName: req.body.RoleName,
      company: req.body.CompanyID,
    };
    
    Role.findByIdAndUpdate(req.params.id, updateRole, { new: true }, (err, role) => {
      if (err) {
        return res.status(500).send('Error in update the role');
      }
      return res.send("role has been updated!");
    });
  });
});

// Delete role
router.delete('/:id', verifyAdminHR, (req, res) => {
  Employee.find({ role: req.params.id }, (err, employees) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (employees.length === 0) {
      Role.findByIdAndRemove(req.params.id, (err, role) => {
        if (err) {
          return res.status(500).send('Error deleting role');
        }
        return res.send(role);
      });
    } else {
      return res.status(403).send('This role is associated with an employee and cannot be deleted');
    }
  });
});

module.exports = router;
