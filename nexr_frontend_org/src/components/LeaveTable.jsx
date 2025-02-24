import React, { useContext, useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { fetchPayslip, getclockinsDataById } from './ReuseableAPI';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { Dropdown } from 'rsuite';
import ViewAttendanceModel from './ViewAttendanceModel';
import { toast } from 'react-toastify';
import { TimerStates } from './payslip/HRMDashboard';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

export default function LeaveTable({ data, Account, getCheckedValue, handleDelete, fetchReportById, isTeamHead, isTeamLead, fetchData, roleObj, getCheckAll, deleteData, replyToLeave }) {
    const navigate = useNavigate();
    const { changeEmpEditForm } = useContext(TimerStates)
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [totalHours, setTotalHours] = useState({}); // To hold total hours for each entry
    const [openModal, setOpenModal] = useState(false);
    const [modelData, setModelData] = useState({});
    const params = useParams();
    const [timeOption, setTimeOption] = useState("login");

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const column1 = [
        { id: 'FirstName', label: 'Name', minWidth: 100, align: "left", getter: (row) => row.employee.FirstName[0].toUpperCase() + row.employee.FirstName.slice(1) + row.employee.LastName || 'Unknown' },
        { id: 'periodOfLeave', label: 'Period Of Leave', align: "left", minWidth: 100, getter: (row) => row.periodOfLeave },
        { id: 'fromDate', label: 'Start Date', minWidth: 100, align: 'left', getter: (row) => row.fromDate ? row.fromDate.split("T")[0] : 'N/A' },
        { id: 'toDate', label: 'End Date', minWidth: 100, align: 'left', getter: (row) => row.toDate ? row.toDate.split("T")[0] : 'N/A' },
        { id: 'leaveType', label: 'Type', minWidth: 100, align: 'left', getter: (row) => row.leaveType },
        { id: 'reasonForLeave', label: 'Reason', minWidth: 100, align: 'left', getter: (row) => <div dangerouslySetInnerHTML={{ __html: row.reasonForLeave }} /> },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'left',
            getter: (row) => {
                if (isTeamHead) {
                    return row.TeamHead;
                } else if (isTeamLead) {
                    return row.TeamLead;
                } else if (Account === "2") {
                    return row.Hr;
                } else {
                    return row.status;
                }
            },
        },
        { id: "Action", label: "Action", minWidth: 100, align: "left" }
    ];

    const column2 = [
        { id: 'FirstName', label: 'Name', minWidth: 170, align: 'center', getter: (row) => row?.employee?.FirstName ? `${row.employee.FirstName[0].toUpperCase() + row.employee.FirstName.slice(1)}` : 'N/A' },
        { id: 'basicSalary', label: 'Salary', minWidth: 170, align: 'center', getter: (row) => row?.employee?.basicSalary ? `₹${row.employee.basicSalary}` : 'N/A' },
        { id: 'status', label: 'Status', minWidth: 170, align: 'center', getter: (row) => row?.payslip?.status ? row.payslip.status : 'N/A' },
        { id: 'period', label: 'Period', minWidth: 220, align: 'center', getter: (row) => row?.payslip?.period ? row.payslip.period : 'N/A' },
        { id: 'lossofpay', label: 'LOP', minWidth: 170, align: 'center', getter: (row) => row?.payslip?.LossOfPay },
        { id: 'ESI', label: 'ESI', minWidth: 170, getter: (row) => row?.payslip?.ESI || 'N/A' },
        { id: 'ProvidentFund', label: 'ProvidentFund', minWidth: 170, getter: (row) => row?.payslip?.ProvidentFund || 'N/A' },
        { id: "Action", label: "Action", minWidth: 100, align: "center" }
    ];

    const column3 = [
        {
            id: 'FirstName',
            label: 'Profile',
            minWidth: 100,
            getter: (row) => row?.FirstName + row?.LastName || 'N/A'
        },
        {
            id: 'code',
            label: 'EmpCode',
            minWidth: 100,
            getter: (row) => row?.code || 'N/A'
        },
        {
            id: 'employmentType',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            getter: (row) => row?.employmentType || 'N/A'
        },
        {
            id: 'DepartmentName',
            label: 'Department',
            minWidth: 100,
            align: 'center',
            getter: (row) => row?.department?.DepartmentName || 'N/A'
        },
        {
            id: 'StratingTime',
            label: 'Shift',
            minWidth: 100,
            align: 'center',
            getter: (row) => row?.workingTimePattern?.StartingTime || 'N/A'
        },
        {
            id: 'dateOfJoining',
            label: 'Joining Date',
            minWidth: 100,
            align: 'center',
            getter: (row) => row?.dateOfJoining || 'N/A'
        },
        {
            id: 'RoleName',
            label: 'Role',
            minWidth: 100,
            align: 'center',
            getter: (row) => row?.role?.RoleName || 'N/A'
        },
        {
            id: "Action",
            label: "Action",
            minWidth: 60,
            align: "center"
        }
    ];

    const column4 = [
        { id: 'FirstName', label: 'Profile', minWidth: 170, getter: (row) => row?.employee?.FirstName + row?.employee?.LastName || 'Unknown' },
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
            getter: (row) => row?.login?.startingTime ? row?.login?.startingTime[0] : "N/A"
        },
        {
            id: 'punchOut',
            label: 'Punch Out',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.login?.endingTime ? row.login.endingTime[row.login.endingTime.length - 1] : "N/A"
        },
        {
            id: 'totalHour',
            label: 'Total Hour',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.login?.timeHolder || 0
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
        { id: 'Name', label: 'Name', minWidth: 130, align: 'left', getter: (row) => row?.employee?.FirstName ? `${row.employee.FirstName[0].toUpperCase() + row.employee.FirstName.slice(1)}` : 'N/A' },
        {
            id: 'date',
            label: 'Date',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.date ? row.date.split("T")[0] : "no date"
        },
        // {
        //     id: 'type',
        //     label: 'Type',
        //     minWidth: 130,
        //     align: 'left',
        // },
        {
            id: 'punchIn',
            label: 'Punch In',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.[timeOption]?.startingTime ? row?.[timeOption]?.startingTime[0] : "N/A"
        },
        {
            id: 'punchOut',
            label: 'Punch Out',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.[timeOption]?.endingTime ? row?.[timeOption]?.endingTime[row?.[timeOption]?.endingTime.length - 1] : "00:00:00"
        },
        {
            id: 'totalHour',
            label: 'Total Hour',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.[timeOption]?.timeHolder || 0
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
            align: 'left',
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
            id: 'all',
            label: 'All',
            minWidth: 130,
            align: 'center',
            getter: (row) => (
                <input
                    className="form-check-input"
                    type="checkbox"
                    disabled={params['*'].includes("view") ? true : false}
                    name={`${row.action}`}
                    checked={roleObj?.userPermissions?.[row.action]?.add === true
                        && roleObj?.userPermissions?.[row.action]?.view === true
                        && roleObj?.userPermissions?.[row.action]?.edit === true
                        && roleObj?.userPermissions?.[row.action]?.delete === true}
                    onChange={(e) => getCheckAll(e)}
                />
            )
        },
        {
            id: 'add',
            label: 'Add',
            minWidth: 100,
            align: 'center',
            getter: (row) => (
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={`add-${row.action}`}
                    disabled={params['*'].includes("view") ? true : false}
                    checked={roleObj?.userPermissions?.[row.action]?.add || false}
                    onChange={(e) => getCheckedValue(e)}
                />

            )
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
                    disabled={params['*'].includes("view") ? true : false}
                    checked={roleObj?.userPermissions?.[row.action]?.view || false}
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
                    disabled={params['*'].includes("view") ? true : false}
                    checked={roleObj?.userPermissions?.[row.action]?.edit || false}
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
                    disabled={params['*'].includes("view") ? true : false}
                    checked={roleObj?.userPermissions?.[row.action]?.delete || false}
                    onChange={(e) => getCheckedValue(e)}
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
            id: 'auth',
            label: 'Manage Authorization',
            minWidth: 120,
            align: 'center',
        }
    ]

    const column8 = [
        { id: 'FirstName', label: 'Name', minWidth: 130, align: "left", getter: (row) => row.employee.FirstName[0].toUpperCase() + row.employee.FirstName.slice(1) + row.employee.LastName || 'Unknown' },
        { id: 'periodOfLeave', label: 'Period Of Leave', align: "left", minWidth: 150, getter: (row) => row.periodOfLeave },
        { id: 'fromDate', label: 'Start Date', minWidth: 130, align: 'left', getter: (row) => row.fromDate ? row.fromDate.split("T")[0] : 'N/A' },
        { id: 'toDate', label: 'End Date', minWidth: 130, align: 'left', getter: (row) => row.toDate ? row.toDate.split("T")[0] : 'N/A' },
        { id: 'leaveType', label: 'Type', minWidth: 130, align: 'left', getter: (row) => row.leaveType },
        { id: 'reasonForLeave', label: 'Reason', minWidth: 130, align: 'left', getter: (row) => row.reasonForLeave },
        { id: 'status', label: 'Status', minWidth: 130, align: 'left', getter: (row) => row.status },
    ];

    const column9 = [
        {
            id: 'DepartmentName',
            label: 'Departments',
            minWidth: 120,
            align: 'left',
            getter: (row) => row?.DepartmentName
        },
        {
            id: 'Manage',
            label: 'Manage Departments',
            minWidth: 120,
            align: 'center',
        }
    ]

    const column10 = [
        {
            id: 'PositionName',
            label: 'Position',
            minWidth: 120,
            align: 'left',
            getter: (row) => row?.PositionName
        },
        {
            id: 'Manage',
            label: 'Manage Position',
            minWidth: 120,
            align: 'center',
        }
    ]

    const column11 = [
        { id: 'title', label: 'Title', minWidth: 150, align: 'left', getter: (row) => row.title || 'Untitled' },
        { id: 'startDate', label: 'Start Date', minWidth: 130, align: 'left', getter: (row) => row.startDate ? row.startDate.split("T")[0] : 'N/A' },
        { id: 'endDate', label: 'End Date', minWidth: 130, align: 'left', getter: (row) => row.endDate ? row.endDate.split("T")[0] : 'N/A' },
        { id: 'message', label: 'Message', minWidth: 200, align: 'left', getter: (row) => row.message.replace(/<[^>]*>/g, "") || 'No message' },
        { id: 'action', label: 'Action', minWidth: 100, align: 'center', getter: (row) => row.action || 'No action' },
    ];

    const column12 = [
        {
            id: 'name',
            label: 'Name',
            minWidth: 130,
            align: "left",
            getter: (row) => row?.name || "N/A"
        },
        {
            id: 'startDate',
            label: 'Start Date',
            minWidth: 130,
            align: 'left',
            getter: (row) => row.startDate ? row.startDate.split("T")[0] : 'N/A',
        },
        {
            id: 'endDate',
            label: 'End Date',
            minWidth: 130,
            align: 'left',
            getter: (row) => row.endDate ? row.endDate.split("T")[0] : 'N/A',
        },
        {
            id: 'createdby',
            label: 'Created By',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.createdby?.FirstName[0].toUpperCase() + row?.createdby?.FirstName.slice(1)
        },
        {
            id: "Action",
            label: "Action",
            minWidth: 60,
            align: "center"
        },
    ];

    const column13 = [
        {
            id: 'CompanyName',
            label: 'CompanyName',
            minWidth: 120,
            align: 'left',
            getter: (row) => row?.CompanyName
        },
        {
            id: 'Manage',
            label: 'Manage Company',
            minWidth: 120,
            align: 'center',
        }
    ]

    const column14 = [
        { id: 'icon', label: 'Icon', minWidth: 50, align: "left", getter: (row) => row.icon },
        { id: 'name', label: 'Name', minWidth: 100, align: "left", getter: (row) => row.name },
        { id: 'abbreviation', label: 'Abbreviation', minWidth: 100, align: "left", getter: (row) => row.abbr },
        { id: 'code', label: 'Code', minWidth: 100, align: "left", getter: (row) => row.code },
        { id: 'state', label: 'State', minWidth: 130, align: "left", getter: (row) => row?.state?.length ? row.state.join(", ") : "N/A" },
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
        } else if (page === "payslip") {
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
        data?.map((item) => {
            if (item?.fromDate && (params['*'] === "leave-request" || params['*'] === "leave")) {
                return setColumns(column1);
            } else if (item?.FirstName && params["*"] === "employee") {
                return setColumns(column3);
            } else if (item?.date && params['*'] === "attendance-summary"
                || item?.date && params['*'] === "details"
                || item?.date && params['*'] === "attendance-request"
                || item?.date && params['*'] === "attendance"
            ) {
                return setColumns(column5);
            } else if (item?.date) {
                return setColumns(column4);
            } else if (item?.action) {
                return setColumns(column6);
            } else if (item?.RoleName) {
                return setColumns(column7);
            }
            else if (item?.fromDate && params['*'] === "status"
                || item?.fromDate && params['*'] === "leave-summary"
                || item?.fromDate && params['*'] === "calendar") {
                return setColumns(column8);
            } else if (item?.DepartmentName) {
                return setColumns(column9)
            } else if (item?.PositionName) {
                return setColumns(column10)
            } else if (item?.title) {
                return setColumns(column11)
            } else if (item?.createdby) {
                return setColumns(column12)
            } else if (item?.CompanyName) {
                return setColumns(column13)
            } else if (item?.icon) {
                return setColumns(column14)
            }
            else {
                return setColumns(column2)
            }
        })
    }, [data, timeOption]);


    return (
        <div className="container-fluid my-3">
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead className='changeColor'>
                            <TableRow sx={{ backgroundColor: "gray" }}>
                                {columns.map((column, index) => (
                                    <TableCell
                                        key={index}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth, minHeight: "50px" }}
                                    >
                                        {column.label}
                                    </TableCell>

                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {

                                rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rowIndex) => (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                                        {columns?.map((column) => {
                                            const value = column.getter ? column.getter(row, rowIndex) : row[column?.id];

                                            // Apply conditional styling for employee type
                                            const cellClass =
                                                column.id === "employmentType" && value === "contract" ? "backgroundBtn bg-primary rounded" :
                                                    value === "Part-time" ? "backgroundBtn bg-warning rounded" :
                                                        value === "Full-time" ? "backgroundBtn bg-success rounded" : "";

                                            // Render actions based on column.id and params
                                            const renderActions = () => {
                                                if (column.id === "reasonForLeave") {
                                                } else if (column.id === "Action") {
                                                    if (params['*'] === "leave-request") {
                                                        return (
                                                            <Dropdown placement='leftStart' title={<EditRoundedIcon style={{ cursor: "pointer" }} />} noCaret>
                                                                {/* <Dropdown.Item style={{ minWidth: 120 }}>Response</Dropdown.Item> */}
                                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => replyToLeave(row, "approved")}>Approve</Dropdown.Item>
                                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => replyToLeave(row, "rejected")}>Reject</Dropdown.Item>
                                                            </Dropdown>
                                                        );
                                                    } else if (params['*'] === "payslip" || params['*'] === "daily-log") {
                                                        return (
                                                            <Dropdown title={<RemoveRedEyeRoundedIcon style={{ cursor: "pointer" }} />} noCaret onClick={() => getValueForView([row._id, params['*']])}>
                                                            </Dropdown>
                                                        );
                                                    } else if (params['*'] === "employee") {
                                                        return (
                                                            <Dropdown title={<EditRoundedIcon style={{ cursor: "pointer" }} />} placement='leftStart' noCaret>
                                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => changeEmpEditForm(row._id)}>Edit</Dropdown.Item>
                                                                <Dropdown.Item style={{ minWidth: 120 }}>Delete</Dropdown.Item>
                                                            </Dropdown>
                                                        );
                                                    } else if (params["*"] === "reports") {
                                                        return (
                                                            <Dropdown title={"Action"} placement='leftStart' noCaret>
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => fetchReportById(row._id, "View")}>
                                                                    <b>
                                                                        <RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View
                                                                    </b>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => fetchReportById(row._id, "Edit")}>
                                                                    <b>
                                                                        <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                    </b>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleDelete(row)}>
                                                                    <b>
                                                                        <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Put in the trash
                                                                    </b>
                                                                </Dropdown.Item>
                                                            </Dropdown>
                                                        )
                                                    } else if (params["*"] === "country") {
                                                        return (<Dropdown title={"Action"} noCaret placement="leftStart">
                                                            <Dropdown.Item style={{ minWidth: 80 }} onClick={() => fetchData(row.code, "Edit")}>
                                                                <b>
                                                                    <BorderColorRoundedIcon sx={{ color: "#80C4E9" }} /> Add State
                                                                </b>
                                                            </Dropdown.Item>
                                                        </Dropdown>)

                                                    } else if (params["*"] === "leave") {
                                                        return (<Dropdown title={"Action"} noCaret placement="leftStart">
                                                            <Dropdown.Item style={{ minWidth: 80 }} onClick={() => fetchData(row.code, "Edit")}>
                                                                <b>
                                                                    <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                </b>
                                                            </Dropdown.Item>
                                                        </Dropdown>)
                                                    }
                                                } else if (column.id === "auth") {
                                                    return (
                                                        <Dropdown title={<KeyRoundedIcon style={{ cursor: "pointer" }} />} placement='leftStart' noCaret>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => navigate(`view/${row._id}`)}><RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View</Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => navigate(`edit/${row._id}`)}><BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit</Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => deleteData(row._id)}><DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete</Dropdown.Item>
                                                        </Dropdown>
                                                    );
                                                } else if (["department", "position", "company"].includes(params["*"])) {
                                                    return (
                                                        <Dropdown title={<EditRoundedIcon style={{ cursor: "pointer" }} />} placement='leftStart' noCaret>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => fetchData(row._id)}>
                                                                <b>
                                                                    <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                </b>                                                        </Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => deleteData(row._id)}>
                                                                <b>
                                                                    <DeleteRoundedIcon sx={{ color: "#F93827" }} />
                                                                    Delete
                                                                </b>
                                                            </Dropdown.Item>
                                                        </Dropdown>
                                                    );
                                                }
                                                //  else if (column.id === "type" && params["*"] === "attendance") {
                                                //     console.log("aaaaaa");

                                                //     return (
                                                //         <select className='form-control' value={timeOption} onChange={(e) => setTimeOption(e.target.value)}>
                                                //             <option value="login">Login</option>
                                                //             <option value="meeting">Meeting</option>
                                                //             <option value="morningBreak">Morning Break</option>
                                                //             <option value="lunch">Lunch</option>
                                                //             <option value="eveningBreak">Evening Break</option>
                                                //             <option value="event">Event</option>
                                                //         </select>
                                                //     )
                                                // }
                                                return null;
                                            };

                                            return (
                                                <TableCell
                                                    key={column.id}
                                                    align={column.align}
                                                    className={cellClass}
                                                >
                                                    {["Action", "auth", "Manage"].includes(column.id) ? renderActions() : value}
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

            {
                openModal ?
                    <ViewAttendanceModel modelData={modelData} toggleView={toggleView} totalHours={totalHours} openModal={openModal} /> : null
            }
        </div >
    );
}
