const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyAdminHREmployee, verifyAdmin } = require('../auth/authMiddleware');
const configPath = path.join(__dirname, '../countriesData/countryCode.json');

// Read JSON file
const readData = () => {
    const rawData = fs.readFileSync(configPath);
    return JSON.parse(rawData);
};

// Write to JSON file
const writeData = (data) => {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
};

// // Get all users
// exports.getAllUsers = (req, res) => {
//     try {
//         const data = readData();
//         res.json(data.users);
//     } catch (error) {
//         res.status(500).json({ message: "Error reading data", error });
//     }
// };

// // Get user by ID
// exports.getUserById = (req, res) => {
//     try {
//         const data = readData();
//         const user = data.users.find(user => user.id === parseInt(req.params.id));
//         if (!user) return res.status(404).json({ message: "User not found" });
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching user", error });
//     }
// };

//get all country data
router.get("/", verifyAdminHREmployee, async (req, res) => {
    try {
        const rawData = readData();
        return res.send(rawData);
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

// get state data
router.get("/:name", verifyAdminHREmployee, async (req, res) => {
    try {
        const rawData = readData();
        const states = rawData.filter((item) => item.name === item[req.params.name]).states;
        if (states.length > 0) {
            return res.send(states)
        } else {
            return res.status(404).send({ error: `States data not found in ${req.params.name}` })
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

// Create a Country or state
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const data = readData();
        const isExists = data.some((item) => item.code === req.body.code);
        if (isExists) {
            return res.status(400).send({ error: "Country already Exists" })
        } else {
            data.countries.push(req.body);
            writeData(data);
            res.status(201).json(newUser);
        }
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error });
    }
})

// Update user
// exports.updateUser = (req, res) => {
//     try {
//         const data = readData();
//         const index = data.users.findIndex(user => user.id === parseInt(req.params.id));
//         if (index === -1) return res.status(404).json({ message: "User not found" });

//         data.users[index] = { ...data.users[index], ...req.body };
//         writeData(data);
//         res.json(data.users[index]);
//     } catch (error) {
//         res.status(500).json({ message: "Error updating user", error });
//     }
// };


// // Delete user
// exports.deleteUser = (req, res) => {
//     try {
//         let data = readData();
//         const newData = data.users.filter(user => user.id !== parseInt(req.params.id));

//         if (data.users.length === newData.length) return res.status(404).json({ message: "User not found" });

//         writeData({ users: newData });
//         res.json({ message: "User deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Error deleting user", error });
//     }
// };



// router.get("/", verifyAdminHREmployee, (req, res) => {
//   Country.find()
//     .exec(function (err, country) {
//       if (err) {
//         res.status(500).send(err);
//       } else {
//         res.send(country);
//       }
//     });
// });

// router.get("/:name", verifyAdminHREmployee, async (req, res) => {
//   try {
//     const country = await Country.findOne({ CountryName: req.params.name })
//       .populate("states")
//       .exec();

//     if (!country) {
//       return res.status(404).send({ message: "Country not found" });
//     }
//     res.send(country);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ message: "An error occurred", error: err });
//   }
// });

// router.post("/", verifyHR, (req, res) => {
//   Joi.validate(req.body, CountryValidation, (err, result) => {
//     if (err) {
//       console.log(err);
//       res.status(400).send(err.details[0].message);
//     } else {
//       let newCountry;

//       newCountry = {
//         CountryName: req.body.CountryName
//       };

//       Country.create(newCountry, function (err, country) {
//         if (err) {
//           res.status(500).send(err, "check url and data");
//         } else {
//           res.send("New country has been added!");
//           // console.log("new country Saved");
//         }
//       });
//       console.log(req.body);
//     }
//   });
// });

// router.put("/:id", verifyHR, (req, res) => {
//   Joi.validate(req.body, CountryValidation, (err, result) => {
//     if (err) {
//       console.log(err);
//       res.status(400).send(err.details[0].message);
//     } else {
//       let newCountry;

//       newCountry = {
//         CountryName: req.body.CountryName
//       };
//       Country.findByIdAndUpdate(req.params.id, {
//         $set: newCountry
//       }, function (
//         err,
//         country
//       ) {
//         if (err) {
//           res.status(500).send("check url and data");
//         } else {
//           res.send("country has been updated!");
//         }
//       });
//     }

//     console.log("put");
//     console.log(req.body);
//   });
// });

// router.delete("/:id", verifyHR, (req, res) => {
//   Country.findById(req.params.id, function (err, foundCountry) {
//     if (err) {
//       res.send(err);
//     } else {
//       console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", foundCountry);
//       if (!foundCountry.states.length == 0) {
//         res
//           .status(403)
//           .send(
//             "First Delete All The states in this country before deleting this country"
//           );
//       } else {
//         Country.findByIdAndRemove({ _id: req.params.id }, function (
//           err,
//           country
//         ) {
//           if (!err) {
//             State.deleteMany({ CountryID: { _id: req.params.id } }, function (
//               err
//             ) {
//               if (err) {
//                 console.log(err);
//                 res.send("error");
//               } else {
//                 City.deleteMany(
//                   { state: { CountryID: { _id: req.params.id } } },
//                   function (err) {
//                     if (err) {
//                       console.log(err);
//                       res.send("error");
//                     } else {
//                       res.send("Country has been deleted!");
//                     }
//                   }
//                 );
//               }
//             });
//           } else {
//             console.log(err);
//             res.send("error");
//           }
//         });
//       }
//     }
//   });
// });

module.exports = router;