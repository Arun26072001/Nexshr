import React, { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { getTotalWorkingHourPerDay } from './ReuseableAPI';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useParams } from 'react-router-dom';
import { Dropdown } from 'rsuite';
import DropdownItem from 'rsuite/esm/Dropdown/DropdownItem';
import ViewAttendanceModel from './ViewAttendanceModel';

export default function LeaveTable({ data }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [totalHours, setTotalHours] = useState({}); // To hold total hours for each entry
    const [openModal, setOpenModal] = useState(false);
    const params = useParams();
    console.log(data);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    useEffect(() => {
        const computeTotalHours = async () => {
            const newTotalHours = {};
            for (const entry of data) {
                const clockIn = entry?.login; // Adjust according to your data structure
                if (clockIn?.startingTime && clockIn?.endingTime) {
                    newTotalHours[entry._id] = (await getTotalWorkingHourPerDay(clockIn.startingTime, clockIn.endingTime)).toFixed(2);
                } else {
                    newTotalHours[entry._id] = 'N/A';
                }
            }
            console.log(newTotalHours);

            setTotalHours(newTotalHours);
        };

        computeTotalHours();
    }, [data]);

    const column1 = [
        { id: 'FirstName', label: 'Name', minWidth: 130, align: "center", getter: (row) => row.employee.FirstName + row.employee.LastName || 'Unknown' },
        { id: 'periodOfLeave', label: 'Period Of Leave', align: "center", minWidth: 130, getter: (row) => row.periodOfLeave },
        { id: 'fromDate', label: 'Start Date', minWidth: 130, align: 'center', getter: (row) => row.fromDate ? row.fromDate.split("T")[0] : 'N/A' },
        { id: 'toDate', label: 'End Date', minWidth: 130, align: 'center', getter: (row) => row.toDate ? row.toDate.split("T")[0] : 'N/A' },
        { id: 'leaveType', label: 'Type', minWidth: 130, align: 'center', getter: (row) => row.leaveType },
        { id: 'reasonForLeave', label: 'Reason', minWidth: 130, align: 'center', getter: (row) => row.reasonForLeave },
        { id: 'status', label: 'Status', minWidth: 130, align: 'center', getter: (row) => row.status },
        { id: "Action", label: "Action", minWidth: 100, align: "center" }
    ];

    const column2 = [
        { id: 'payrun', label: 'Payrun', minWidth: 170, getter: (row) => row.payrun || 'Unknown' },
        { id: 'payrunType', label: 'Payrun Type', minWidth: 170, getter: (row) => row.payrunType || 'N/A' },
        { id: 'status', label: 'Status', minWidth: 170, align: 'center', getter: (row) => row.status || 'N/A' },
        { id: 'period', label: 'Period', minWidth: 170, align: 'center', getter: (row) => row.period || 'N/A' },
        { id: 'salary', label: 'Salary', minWidth: 170, align: 'right', getter: (row) => row.salary ? `₹${row.salary}` : 'N/A' },
    ];

    const column3 = [
        {
            id: 'FirstName',
            label: 'Profile',
            minWidth: 170,
            getter: (row) => row.FirstName + row.LastName || 'N/A'
        },
        {
            id: 'serialNo',
            label: 'ID',
            minWidth: 170,
            getter: (row) => row.serialNo || 'N/A'
        },
        {
            id: 'employmentType',
            label: 'Status',
            minWidth: 170,
            align: 'center',
            getter: (row) => row.employmentType || 'N/A'
        },
        {
            id: 'DepartmentName',
            label: 'Department',
            minWidth: 170,
            align: 'center',
            getter: (row) => row.department.map(dep => dep.DepartmentName) || 'N/A'
        },
        {
            id: 'StratingTime',
            label: 'Shift',
            minWidth: 170,
            align: 'center',
            getter: (row) => row.workingTimePattern.StartingTime || 'N/A'
        },
        {
            id: 'dateOfJoining',
            label: 'Joining Date',
            minWidth: 170,
            align: 'center',
            getter: (row) => row.dateOfJoining
        },
        {
            id: 'RoleName',
            label: 'Role',
            minWidth: 170,
            align: 'center',
            getter: (row) => row.role.map(item => item.RoleName) || 'N/A'
        }
    ];

    const column4 = [
        { id: 'FirstName', label: 'Profile', minWidth: 170, getter: (row) => row.employee.FirstName + row.employee.LastName || 'Unknown' },
        {
            id: 'date',
            label: 'Date',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.date ? row.date.split("T")[0] : "no date"
        },
        {
            id: 'punchIn',
            label: 'Punch In',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.login?.startingTime ? row?.login?.startingTime : "N/A"
        },
        {
            id: 'punchOut',
            label: 'Punch Out',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.login?.endingTime ? row.login.endingTime : "N/A"
        },
        {
            id: 'totalHour',
            label: 'Total Hour',
            minWidth: 130,
            align: 'center',
            getter: (row) => totalHours[row._id] || 'N/A'
        },
        {
            id: 'behaviour',
            label: 'Behaviour',
            minWidth: 130,
            align: 'center',
            getter: (row) => row.behaviour ? row.behaviour : 'N/A'
        },
        {
            id: "Action",
            label: "Action",
            minWidth: 100,
            align: "center"
        }
    ];

    function toggleView() {
        setOpenModal(!openModal);
    }

    useEffect(() => {
        setRows(data || []);
        data.map((item) => {
            if (item.fromDate) {
                return setColumns(column1);
            } else if (item.code) {
                return setColumns(column3);
            } else if (item.date) {
                return setColumns(column4);
            } else {
                return setColumns(column2)
            }
        })
    }, [data]);

    return (
        <div className="container-fluid my-3">
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead className='changeColor'>
                            <TableRow sx={{ backgroundColor: "gray" }}>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth, minHeight: "50px" }}
                                    >
                                        {column.label}
                                    </TableCell>

                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                                return (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                                        {columns.map((column) => {
                                            const value = column.getter ? column.getter(row) : row[column.id];
                                            return (
                                                <TableCell key={column.id} align={column.align} className={column.id && value === "contract" ? "backgroundBtn bg-primary rounded"
                                                    : value === "part-time" ? "backgroundBtn bg-warning rounded"
                                                        : value === "full-time" ? "backgroundBtn bg-success rounded" : null}>
                                                    {column.id === "Action" && params['*'] === "request" ?
                                                        <Dropdown title={<EditRoundedIcon style={{ cursor: "pointer" }} />} noCaret>
                                                            <DropdownItem>Change log</DropdownItem>
                                                            <DropdownItem>Approve</DropdownItem>
                                                            <DropdownItem>Reject</DropdownItem>
                                                        </Dropdown> : column.id === "Action" && params['*'] === "daily-log" ?
                                                            <Dropdown title={<EditRoundedIcon style={{ cursor: "pointer" }} />} noCaret>
                                                                <DropdownItem onClick={toggleView}>View</DropdownItem>
                                                                <DropdownItem>Edit</DropdownItem>
                                                                <DropdownItem>Delete</DropdownItem>
                                                            </Dropdown> : value
                                                    }
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 100]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Modal for Change Log */}
            {
                openModal ?
                    <ViewAttendanceModel id={data[0]._id} toggleView={toggleView} totalHours={totalHours} openModal={openModal} /> : null
            }
        </div >

    );
}
