
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
                    { label: 'Alice', value: 'alice',id:'1' },
                    { label: 'Bob', value: 'bob',id:2 },
                    { label: 'Charlie', value: 'charlie',id:3}
                ]
            },
            {
                label: 'Developers',
                value: 'developers',
                children: [
                    { label: 'David', value: 'david',id:4 },
                    { label: 'Emma', value: 'emma',id:5 },
                    { label: 'Frank', value: 'frank',id:6 }
                ]
            },
            {
                label: 'Testing',
                value: 'testing',
                children: [
                    { label: 'George', value: 'george',id:7 },
                    { label: 'Hannah', value: 'hannah',id:8 }
                ]
            },
            {
                label: 'Digital Marketing',
                value: 'digital-marketing',
                children: [
                    { label: 'Ian', value: 'ian',id:9},
                    { label: 'Jack', value: 'jack',id:10 }
                ]
            },
            {
                label: 'Sales',
                value: 'sales',
                children: [
                    { label: 'Karen', value: 'karen',id:11 },
                    { label: 'Leo', value: 'leo',id:12 }
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
