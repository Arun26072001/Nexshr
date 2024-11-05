
// module.exports = router;
const express = require("express");
const router = express.Router();

// Define the team structure with "Select All" option
const teams = [
    {
        label: 'Select All',
        value: 'select-all',
        children: [
            { 
                label: 'Designing',
                value: 'designing',
                children: [
                    { label: 'Alice', value: 'alice' },
                    { label: 'Bob', value: 'bob' },
                    { label: 'Charlie', value: 'charlie' }
                ]
            },
            {
                label: 'Developers',
                value: 'developers',
                children: [
                    { label: 'David', value: 'david' },
                    { label: 'Emma', value: 'emma' },
                    { label: 'Frank', value: 'frank' }
                ]
            },
            {
                label: 'Testing',
                value: 'testing',
                children: [
                    { label: 'George', value: 'george' },
                    { label: 'Hannah', value: 'hannah' }
                ]
            },
            {
                label: 'Digital Marketing',
                value: 'digital-marketing',
                children: [
                    { label: 'Ian', value: 'ian' },
                    { label: 'Jack', value: 'jack' }
                ]
            },
            {
                label: 'Sales',
                value: 'sales',
                children: [
                    { label: 'Karen', value: 'karen' },
                    { label: 'Leo', value: 'leo' }
                ]
            }
        ]
    }
];

// Define the GET route for teams
router.get("/", (req, res) => {
    res.status(200).json({ teams });
});

module.exports = router;








// const express = require("express");
// const router = express.Router();

// // Define the team structure
// const teams = [
//     {
//         label: 'Designing',
//         value: 'designing',
//         children: [
//             { label: 'Alice', value: 'alice' },
//             { label: 'Bob', value: 'bob' },
//             { label: 'Charlie', value: 'charlie' }
//         ]
//     },
//     {
//         label: 'Developers',
//         value: 'developers',
//         children: [
//             { label: 'David', value: 'david' },
//             { label: 'Emma', value: 'emma' },
//             { label: 'Frank', value: 'frank' }
//         ]
//     },
//     {
//         label: 'Testing',
//         value: 'testing',
//         children: [
//             { label: 'George', value: 'george' },
//             { label: 'Hannah', value: 'hannah' }
//         ]
//     },
//     {
//         label: 'Digital Marketing',
//         value: 'digital-marketing',
//         children: [
//             { label: 'Ian', value: 'ian' },
//             { label: 'Jack', value: 'jack' }
//         ]
//     },
//     {
//         label: 'Sales',
//         value: 'sales',
//         children: [
//             { label: 'Karen', value: 'karen' },
//             { label: 'Leo', value: 'leo' }
//         ]
//     }
// ];


// // Define the GET route for teams
// router.get("/", (req, res) => {
//     res.status(200).json({ teams });
// });
