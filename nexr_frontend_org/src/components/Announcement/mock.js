export const mockTreeData = () => {
    const teams = [
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
    ];

    return [
        {
            label: 'Select All',
            value: 'select-all',
            children: teams // All teams as children of "Select All"
        }
    ];
};


// export const mockTreeData = () => {
//     const teams = [
//         {
//             label: 'Designing',
//             value: 'designing',
//             id: 'team1',
//             children: [
//                 { label: 'Alice', value: 'alice', id: 'emp1' },
//                 { label: 'Bob', value: 'bob', id: 'emp2' },
//                 { label: 'Charlie', value: 'charlie', id: 'emp3' }
//             ]
//         },
//         {
//             label: 'Developers',
//             value: 'developers',
//             id: 'team2',
//             children: [
//                 { label: 'David', value: 'david', id: 'emp4' },
//                 { label: 'Emma', value: 'emma', id: 'emp5' },
//                 { label: 'Frank', value: 'frank', id: 'emp6' }
//             ]
//         },
//         {
//             label: 'Testing',
//             value: 'testing',
//             id: 'team3',
//             children: [
//                 { label: 'George', value: 'george', id: 'emp7' },
//                 { label: 'Hannah', value: 'hannah', id: 'emp8' }
//             ]
//         },
//         {
//             label: 'Digital Marketing',
//             value: 'digital-marketing',
//             id: 'team4',
//             children: [
//                 { label: 'Ian', value: 'ian', id: 'emp9' },
//                 { label: 'Jack', value: 'jack', id: 'emp10' }
//             ]
//         },
//         {
//             label: 'Sales',
//             value: 'sales',
//             id: 'team5',
//             children: [
//                 { label: 'Karen', value: 'karen', id: 'emp11' },
//                 { label: 'Leo', value: 'leo', id: 'emp12' }
//             ]
//         },
//         {
//             label: 'HR',
//             value: 'hr',
//             id: 'team6', // New team added
//             children: [
//                 { label: 'Nina', value: 'nina', id: 'emp13' },
//                 { label: 'Omar', value: 'omar', id: 'emp14' }
//             ]
//         }
//     ];

//     return [
//         {
//             label: 'Select All',
//             value: 'select-all',
//             id: 'selectAll',
//             children: teams
//         }
//     ];
// };
// export const mockTreeData = () => {
//     const teams = [
//         {
//             label: 'Designing',
//             value: 'Designing',
//             children: [
//                 { label: 'Alice', value: 'Alice' },
//                 { label: 'Bob', value: 'Bob' },
//                 { label: 'Charlie', value: 'Charlie' }
//             ]
//         },
//         {
//             label: 'Developers',
//             value: 'Developers',
//             children: [
//                 { label: 'David', value: 'David' },
//                 { label: 'Emma', value: 'Emma' },
//                 { label: 'Frank', value: 'Frank' }
//             ]
//         },
//         {
//             label: 'Testing',
//             value: 'Testing',
//             children: [
//                 { label: 'George', value: 'George' },
//                 { label: 'Hannah', value: 'Hannah' }
//             ]
//         },
//         {
//             label: 'Digital Marketing',
//             value: 'Digital Marketing',
//             children: [
//                 { label: 'Ian', value: 'Ian' },
//                 { label: 'Jack', value: 'Jack' }
//             ]
//         },
//         {
//             label: 'Sales',
//             value: 'Sales',
//             children: [
//                 { label: 'Karen', value: 'Karen' },
//                 { label: 'Leo', value: 'Leo' }
//             ]
//         }
//     ];

//     return [
//         {
//             label: 'Select All',
//             value: 'select-all',
//             children: teams // Select All contains all teams and members
//         },
//     ];
// };
