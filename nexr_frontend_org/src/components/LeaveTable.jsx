import React, { useContext, useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { fetchPayslip, getclockinsDataById, getTotalWorkingHourPerDay } from './ReuseableAPI';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded';
import { useParams } from 'react-router-dom';
import { Dropdown } from 'rsuite';
import DropdownItem from 'rsuite/esm/Dropdown/DropdownItem';
import ViewAttendanceModel from './ViewAttendanceModel';
import { toast } from 'react-toastify';
import { Checkbox } from "rsuite";
import { TimerStates } from './payslip/HRMDashboard';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';

export default function LeaveTable({ data, manageAuthorization, getCheckedValue, roleObj, getCheckAll }) {
    const { changeEmpEditForm } = useContext(TimerStates)
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
        },
        {
            id: "Action",
            label: "Action",
            minWidth: 100,
            align: "center"
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

    const column6 = [
        {
            id: 'sNo',
            label: 'S.No',
            minWidth: 50,
            align: 'center',
            getter: (row) => row.sNo // Generates the serial number (S.No)
        },
        {
            id: 'action',
            label: 'Actions',
            minWidth: 120,
            align: 'left',
            getter: (row) => row?.action
        },
        {
            id: 'view',
            label: 'View',
            minWidth: 100,
            align: 'center',
            getter: (row) => (
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={`view-${row.action}`}
                    checked={roleObj?.[row.action]?.view || false}
                    onChange={(e) => getCheckedValue(e)}
                />
            )
        },
        {
            id: 'edit',
            label: 'Edit',
            minWidth: 100,
            align: 'center',
            getter: (row) => (
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={`edit-${row.action}`}
                    checked={roleObj?.[row.action]?.edit || false}
                    onChange={(e) => getCheckedValue(e)}
                />
            )
        },
        {
            id: 'delete',
            label: 'Delete',
            minWidth: 100,
            align: 'center',
            getter: (row) => (
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={`delete-${row.action}`}
                    checked={roleObj?.[row.action]?.delete || false}
                    onChange={(e) => getCheckedValue(e)}
                />
            )
        },
        {
            id: 'update',
            label: 'Update',
            minWidth: 100,
            align: 'center',
            getter: (row) => (
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={`update-${row.action}`}
                    checked={roleObj?.[row.action]?.update || false}
                    onChange={(e) => getCheckedValue(e)}
                />

            )
        },
        {
            id: 'all',
            label: 'All',
            minWidth: 130,
            align: 'center',
            getter: (row) => (
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={`${row.action}`}
                    onChange={(e) => getCheckAll(e)}
                />
            )
        }
    ];


    const column7 = [
        {
            id: 'sNo',
            label: 'S.No',
            minWidth: 50,
            align: 'center',
            getter: (row, index) => index + 1
            // Generates the serial number (S.No)
        },
        {
            id: 'RoleName',
            label: 'Role',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.RoleName
        },
        {
            id: 'CompanyName',
            label: 'Company',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.company?.map((item) => item.CompanyName)
        }, {
            id: 'auth',
            label: 'Manage Authorization',
            minWidth: 120,
            align: 'center',
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
                    const data = await getclockinsDataById(id);
                    console.log(data);

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
            } else if (item.action) {
                return setColumns(column6);
            } else if (item.RoleName) {
                return setColumns(column7);
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
                            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rowIndex) => (
                                <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                                    {columns.map((column, colIndex) => {
                                        const value = column.getter ? column.getter(row, rowIndex) : row[column.id];

                                        // Apply conditional styling for employee type
                                        const cellClass =
                                            column.id === "employmentType" && value === "contract" ? "backgroundBtn bg-primary rounded" :
                                                value === "part-time" ? "backgroundBtn bg-warning rounded" :
                                                    value === "full-time" ? "backgroundBtn bg-success rounded" : "";

                                        // Render actions based on column.id and params
                                        const renderActions = () => {
                                            if (column.id === "Action") {
                                                if (params['*'] === "request") {
                                                    return (
                                                        <Dropdown title={<EditRoundedIcon style={{ cursor: "pointer" }} />} noCaret>
                                                            <Dropdown.Item>Change log</Dropdown.Item>
                                                            <Dropdown.Item>Approve</Dropdown.Item>
                                                            <Dropdown.Item>Reject</Dropdown.Item>
                                                        </Dropdown>
                                                    );
                                                } else if (params['*'] === "payslip" || params['*'] === "daily-log") {
                                                    return (
                                                        <Dropdown title={<RemoveRedEyeRoundedIcon style={{ cursor: "pointer" }} />} noCaret onClick={() => getValueForView([row._id, params['*']])}>
                                                        </Dropdown>
                                                    );
                                                } else if (params['*'] === "employee") {
                                                    return (
                                                        <Dropdown title={<EditRoundedIcon style={{ cursor: "pointer" }} />} noCaret>
                                                            <Dropdown.Item onClick={() => changeEmpEditForm(row._id)}>Edit</Dropdown.Item>
                                                            <Dropdown.Item>Delete</Dropdown.Item>
                                                        </Dropdown>
                                                    );
                                                }
                                            } else if (column.id === "auth" && params['*'] === "role") {
                                                return (
                                                    <Dropdown title={<KeyRoundedIcon style={{ cursor: "pointer" }} />} noCaret>
                                                        <Dropdown.Item>View</Dropdown.Item>
                                                        <Dropdown.Item onClick={() => manageAuthorization(row._id)}>Edit</Dropdown.Item>
                                                        <Dropdown.Item>Delete</Dropdown.Item>
                                                    </Dropdown>
                                                );
                                            }
                                            return null;
                                        };

                                        return (
                                            <TableCell
                                                key={column.id}
                                                align={column.align}
                                                className={cellClass}
                                            >
                                                {column.id === "Action" || column.id === "auth" ? renderActions() : value}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
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
