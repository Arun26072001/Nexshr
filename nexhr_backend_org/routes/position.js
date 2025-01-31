const express = require('express');
const router = express.Router();
const { Position, PositionValidation, positionSchema } = require('../models/PositionModel');
const { Employee } = require('../models/EmpModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployee } = require('../auth/authMiddleware');
const mongoose = require("mongoose");

// const positionModel = {};
// function getPositionModel(orgName) {
//   // If model already exists in the object, return it; otherwise, create it
//   if (!positionModel[orgName]) {
//     positionModel[orgName] = mongoose.model(`${orgName}Position`, positionSchema);
//   }

//   return positionModel[orgName];
// }

// router.get("/", verifyAdminHR, (req, res) => {
router.get("/", verifyAdminHREmployee, (req, res) => {
  // const { orgName } = jwt.decode(req.headers['authorization']);
  // const Position = getPositionModel(orgName)
  Position.find()
    .populate("company")
    .exec(function (err, positions) {
      if (err) {
        res.status(500).send({ Error: err })
      }
      res.send(positions);
    });
});

router.get("/:id", verifyAdminHR, (req, res) => {
  // const { orgName } = jwt.decode(req.headers['authorization']);
  // const Position = getPositionModel(orgName)
  Position.findById({ _id: req.params.id })
    // .populate("company")
    .exec(function (err, position) {
      if (err) {
        res.status(500).send({ Error: err })
      }
      res.send(position);
    });
});

router.post("/", verifyAdminHR, (req, res) => {
  Joi.validate(req.body, PositionValidation, async (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {
      if (await Position.exists({ PositionName: req.body.PositionName })) {
        return res.status(400).send({ error: `${req.body.PositionName} Position is already exists` })
      }
      Position.create(req.body, function (err, position) {
        if (err) {
          res.status(500).send({ message: err.message });
        } else {
          res.send({ message: `${position.PositionName} Position Added!` });
          // console.log("new Role Saved");
        }
      });
    }
    // console.log(req.body);
  });
});

router.put("/:id", verifyAdminHR, (req, res) => {
  let updatedPosition = {
    PositionName: req.body.PositionName,
    company: req.body.company
  }
  Joi.validate(updatedPosition, PositionValidation, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {
      Position.findByIdAndUpdate(req.params.id, updatedPosition, function (
        err,
        position
      ) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send("position has been updated! " + position.PositionName);
        }
      });
    }
  });
});

// router.delete("/:id", verifyAdminHR, (req, res) => {
//   // const { orgName } = jwt.decode(req.headers['authorization']);
//   // const OrgEmployeeModel = getEmployeeModel(orgName);
//   Position.find({ position: req.params.id }, function (err, p) {
//     if (err) {
//       console.log(err);
//       res.send(err);
//     } else {
//       if (p.length == 0) {
//         Position.findByIdAndRemove(req.params.id, function (
//           err,
//           position
//         ) {
//           if (!err) {
//             res.send({ message: "position has been deleted!" });
//           } else {
//             res.status(403).send(err);
//           }
//         });
//         console.log("delete");
//         console.log(req.params.id);
//       } else {
//         res
//           .status(403)
//           .send(
//             "This Position is associated with Employee so you can not delete this"
//           );
//       }
//     }
//   });
// });

router.delete("/:id", async (req, res) => {
  try {
    const isEmpInPosition = await Employee.find({ position: req.params.id }).exec();
    if (isEmpInPosition.length > 0) {
      return res.status(400).send({ error: "In this position has some Employee, Please change them to position" })
    } else {
      const deletePos = await Position.findByIdAndRemove({ _id: req.params.id });
      return res.send({ message: "Position has been deleted" })
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

module.exports = router