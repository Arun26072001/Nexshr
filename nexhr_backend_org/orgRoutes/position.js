const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyAdminHR } = require('../auth/authMiddleware');
const { getPositionModel } = require('../OrgModels/OrgPositionModel');
const { getEmployeeModel } = require('../OrgModels/OrgEmpModel');
const { Org } = require('../OrgModels/OrganizationModel');

router.get("/:orgId", verifyAdminHR, async (req, res) => {
  // const { orgName } = jwt.decode(req.headers['authorization']);
  const { orgName } = await Org.findById({ _id: req.params.orgId });
  const OrgPosition = getPositionModel(orgName)
  OrgPosition.find()
    .populate("orgId")
    .exec(function (err, positions) {
      if (err) {
        res.status(500).send({ error: err.message })
      }
      res.send(positions);
    });
});

router.get("/:orgId/:id", verifyAdminHR, async (req, res) => {
  const { orgName } = await Org.findById({ _id: req.params.orgId });
  const OrgPosition = getPositionModel(orgName)
  OrgPosition.findById({ _id: req.params.id })
    .populate("orgId")
    .exec(function (err, position) {
      if (err) {
        res.status(500).send({ error: err.message })
      }
      res.send(position);
    });
});

// router.post("/:id", async (req, res) => {
//   try {
//     // Fetch organization data
//     const orgData = await Org.findById(req.params.id, "orgName");

//     if (!orgData) {
//       return res.status(404).send({ error: "Organization data not found!" });
//     }

//     const { orgName } = orgData;
//     console.log("Organization Name:", orgName);

//     // Get or create the model for this organization
//     const Position = getPositionModel(orgName);
//     console.log(Position);

//     // Now you can use OrgEmployeeModel to add or query employees for this org
//     // Example: adding a new employee
//     const newPosition = new Position(req.body);
//     await newPosition.save();

//     res.status(201).send({ message: "Employee added successfully", position: newPosition });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

router.post("/:orgId", verifyAdminHR, async (req, res) => {
  Joi.validate(req.body, PositionValidation, async (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ error: err.details[0].message });
    } else {
      const { orgName } = await Org.findById({ _id: req.params.orgId });
      const OrgPosition = getPositionModel(orgName)
      OrgPosition.create(req.body, function (err, position) {
        if (err) {
          res.status(500).send({ message: err.message });
        } else {
          res.send("new Position Added!");
          // console.log("new Role Saved");
        }
      });
    }
    // console.log(req.body);
  });
});

router.put("/:orgId/:id", verifyAdminHR, (req, res) => {
  let updatedPosition = {
    PositionName: req.body.PositionName,
    company: req.body.company
  }
  Joi.validate(updatedPosition, PositionValidation, async (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send({ message: err.details[0].message });
    } else {
      const { orgName } = await Org.findById({ _id: req.params.orgId });
      const OrgPosition = getPositionModel(orgName)
      OrgPosition.findByIdAndUpdate(req.params.id, updatedPosition, function (
        err,
        position
      ) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send({ message: "position has been updated! " + position.PositionName });
        }
      });
    }
  });
});

router.delete("/:orgId/:id", verifyAdminHR, async (req, res) => {
  try {
    // Extract orgName from the token
    const { orgName } = await Org.findById({ _id: req.params.orgId });
    if (!orgName) {
      return res.status(401).send("Unauthorized: Invalid token");
    }

    // Get the models
    const OrgEmployeeModel = getEmployeeModel(orgName);
    const PositionModel = getPositionModel(orgName);

    // Check if the position is associated with any employees
    const employees = await OrgEmployeeModel.find({ position: req.params.id });
    if (employees.length > 0) {
      return res.status(403).send(
        "This position is associated with an employee, so it cannot be deleted."
      );
    }

    // Delete the position
    const deletedPosition = await PositionModel.findByIdAndRemove(req.params.id);
    if (!deletedPosition) {
      return res.status(404).send("Position not found");
    }

    res.send("Position has been deleted!");
  } catch (error) {
    console.error("Error deleting position:", error);
    res.status(500).send("An error occurred while processing the request");
  }
});

module.exports = router