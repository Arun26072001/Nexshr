import React, { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { fetchPayslip, getDataAPI, getTotalWorkingHourPerDay } from './ReuseableAPI';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded';
import { useParams } from 'react-router-dom';
import { Dropdown } from 'rsuite';
import DropdownItem from 'rsuite/esm/Dropdown/DropdownItem';
import ViewAttendanceModel from './ViewAttendanceModel';
import { toast } from 'react-toastify';

export default function LeaveTable({ data }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [totalHours, setTotalHours] = useState({}); // To hold total hours for each entry
    const [openModal, setOpenModal] = useState(false);
    const [modelData, setModelData] = useState({});
    const params = useParams();


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
            setTotalHours(newTotalHours);
        };

        computeTotalHours();
    }, [data]);

    const column1 = [
        { id: 'FirstName', label: 'Name', minWidth: 130, align: "left", getter: (row) => row.employee.FirstName[0].toUpperCase() + row.employee.FirstName.slice(1) + row.employee.LastName || 'Unknown' },
        { id: 'periodOfLeave', label: 'Period Of Leave', align: "left", minWidth: 150, getter: (row) => row.periodOfLeave },
        { id: 'fromDate', label: 'Start Date', minWidth: 130, align: 'left', getter: (row) => row.fromDate ? row.fromDate.split("T")[0] : 'N/A' },
        { id: 'toDate', label: 'End Date', minWidth: 130, align: 'left', getter: (row) => row.toDate ? row.toDate.split("T")[0] : 'N/A' },
        { id: 'leaveType', label: 'Type', minWidth: 130, align: 'left', getter: (row) => row.leaveType },
        { id: 'reasonForLeave', label: 'Reason', minWidth: 130, align: 'left', getter: (row) => row.reasonForLeave },
        { id: 'status', label: 'Status', minWidth: 130, align: 'left', getter: (row) => row.status },
        { id: "Action", label: "Action", minWidth: 100, align: "left" }
    ];

    const column2 = [
        { id: 'FirstName', label: 'Name', minWidth: 170, align: 'center', getter: (row) => row.employee.FirstName ? `${row.employee.FirstName[0].toUpperCase() + row.employee.FirstName.slice(1)}` : 'N/A' },
        { id: 'basicSalary', label: 'Salary', minWidth: 170, align: 'center', getter: (row) => row.employee.basicSalary ? `₹${row.employee.basicSalary}` : 'N/A' },
        { id: 'status', label: 'Status', minWidth: 170, align: 'center', getter: (row) => row.payslip.status ? row.payslip.status : 'N/A' },
        { id: 'period', label: 'Period', minWidth: 220, align: 'center', getter: (row) => row.payslip.period ? row.payslip.period : 'N/A' },
        { id: 'lossofpay', label: 'LOP', minWidth: 170, align: 'center', getter: (row) => row?.payslip?.LossOfPay },
        { id: 'ESI', label: 'ESI', minWidth: 170, getter: (row) => row.payslip.ESI || 'N/A' },
        { id: 'ProvidentFund', label: 'ProvidentFund', minWidth: 170, getter: (row) => row.payslip.ProvidentFund || 'N/A' },
        { id: "Action", label: "Action", minWidth: 100, align: "center" }
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
            getter: (row) => totalHours?.[row._id] || 0
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

    const column5 = [
        { id: 'Name', label: 'Name', minWidth: 170, align: 'center', getter: (row) => row.employee.FirstName ? `${row.employee.FirstName[0].toUpperCase() + row.employee.FirstName.slice(1)}` : 'N/A' },
        {
            id: 'date',
            label: 'Date',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.date ? row.date.split("T")[0] : "no date"
        },
        {
            id: 'punchIn',
            label: 'Punch In',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.login?.startingTime ? row?.login?.startingTime : "N/A"
        },
        {
            id: 'punchOut',
            label: 'Punch Out',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.login?.endingTime ? row.login.endingTime : "N/A"
        },
        {
            id: 'totalHour',
            label: 'Total Hour',
            minWidth: 130,
            align: 'left',
            getter: (row) => totalHours?.[row._id] || 0
        },
        {
            id: 'behaviour',
            label: 'Behaviour',
            minWidth: 130,
            align: 'left',
            getter: (row) => row.behaviour ? row.behaviour : 'N/A'
        }
    ]

    function toggleView() {
        setOpenModal(!openModal);
    }

    function getValueForView(value) {
        const [id, page] = value;

        if (page === 'daily-log') {
            async function fetchAttendanceData() {
                try {
                    const data = await getDataAPI(id)
                    setModelData({
                        ...data.timeData,
                        title: "Attendance Details"
                    });
                    toggleView();
                } catch (err) {
                    console.log(err);
                    toast.error(err?.response?.data?.error);
                }
            }
            fetchAttendanceData();
        } else {
            async function fetchPayslips() {
                try {
                    const slips = await fetchPayslip(id);
                    setModelData({
                        ...slips.payslip,
                        title: "Payslip Details",
                        _id: slips._id
                    });
                    toggleView();
                } catch (err) {
                    toast.error(err?.response?.data?.error);
                }
            }
            fetchPayslips();
        }
    }

console.log(params['*']);

    useEffect(() => {
        setRows(data || []);
        data.map((item) => {
            if (item.fromDate) {
                return setColumns(column1);
            } else if (item.code) {
                return setColumns(column3);
            } else if (item.date && params['*'] === "attendance-summary"
                || item.date && params['*'] === "details"
                || item.date && params['*'] === "attendance-request"
                || item.date && params['*'] === "attendance"
            ) {
                return setColumns(column5);
            } else if (item.date) {
                return setColumns(column4);
            }
            else {
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
                                        {columns.map((column, index) => {
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
                                                        </Dropdown> : column.id === "Action" && params['*'] === "payslip" || column.id === "Action" && params['*'] === "daily-log" ?
                                                            <Dropdown title={<RemoveRedEyeRoundedIcon style={{ cursor: "pointer" }} />} noCaret onClick={() => getValueForView([row._id, params['*']])}>
                                                                {/* <DropdownItem onClick={() => getValueForView([row._id, params['*']])}>View</DropdownItem> */}
                                                            </Dropdown>
                                                            : value
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
                    <ViewAttendanceModel modelData={modelData} toggleView={toggleView} totalHours={totalHours} openModal={openModal} /> : null
            }
        </div >

    );
}
