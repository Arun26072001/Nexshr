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
import { EssentialValues } from '../App';
import profile from "../imgs/male_avatar.webp";
import Loading from './Loader';

export default function LeaveTable({ data, Account, getCheckedValue, handleDelete, handleEdit, handleView, handleChangeData, fetchReportById, fetchOrgData, fetchData, roleObj, getCheckAll, deleteData, replyToLeave, handleChangeLeavetype, isTeamHead, isTeamLead, isTeamManager, isLoading }) {
    const navigate = useNavigate();
    const { whoIs } = useContext(EssentialValues);
    const empId = localStorage.getItem("_id")
    const timerStateData = useContext(TimerStates)
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(+localStorage.getItem("rowsPerPage") || 10);
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
        localStorage.setItem("rowsPerPage", event.target.value)
        setRowsPerPage(event.target.value);
        setPage(0);
    };

    const column1 = [
        {
            id: 'FirstName',
            label: 'Name',
            minWidth: 150,
            align: 'left',
            getter: (row) => {
                const firstName = row?.employee?.FirstName || '';
                const lastName = row?.employee?.LastName || '';
                const profileImg = row?.employee?.profile || profile;

                const fullName = firstName
                    ? firstName[0].toUpperCase() + firstName.slice(1) + ' ' + lastName
                    : 'Unknown';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={profileImg}
                            alt="Profile"
                            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <span>{fullName}</span>
                    </div>
                );
            }
        },
        { id: 'periodOfLeave', label: 'Period Of Leave', align: "left", minWidth: 100, getter: (row) => row.periodOfLeave },
        { id: 'fromDate', label: 'Start Date', minWidth: 120, align: 'left', getter: (row) => row.fromDate ? new Date(row?.fromDate).toLocaleDateString() : 'N/A' },
        { id: 'toDate', label: 'End Date', minWidth: 120, align: 'left', getter: (row) => row.toDate ? new Date(row?.toDate).toLocaleDateString() : 'N/A' },
        { id: 'leaveType', label: 'Type', minWidth: 170, align: 'left', getter: (row) => row.leaveType },
        { id: '', label: 'Reason', minWidth: 150, align: 'left', getter: (row) => <div dangerouslySetInnerHTML={{ __html: row.reasonForLeave.slice(0, 20) + (row?.reasonForLeave?.length > 20 ? "..." : "") }} /> },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'left',
            getter: (row) => {
                if (isTeamHead) {
                    return row?.approvers?.head || "N/A";
                } else if (isTeamLead) {
                    return row?.approvers?.lead || "N/A";
                } else if (isTeamManager) {
                    return row?.approvers?.manager || "N/A";
                } else if (Account === "2") {
                    return row?.approvers?.hr || "N/A";
                } else {
                    return row.status;
                }
            },
        },
        { id: "Action", label: "Action", minWidth: 100, align: "left" }
    ];

    const column2 = [
        {
            id: 'FirstName',
            label: 'Name',
            minWidth: 150,
            align: 'left',
            getter: (row) => {
                const firstName = row?.employee?.FirstName || '';
                const lastName = row?.employee?.LastName || '';
                const profileImg = row?.employee?.profile || profile;

                const fullName = firstName
                    ? firstName[0].toUpperCase() + firstName.slice(1) + ' ' + lastName
                    : 'Unknown';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={profileImg}
                            alt="Profile"
                            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <span>{fullName}</span>
                    </div>
                );
            }
        },
        { id: 'basicSalary', label: 'Salary', minWidth: 120, align: 'center', getter: (row) => row?.payslip?.basicSalary ? `₹${row.payslip.basicSalary}` : 'N/A' },
        { id: 'status', label: 'Status', minWidth: 120, align: 'center', getter: (row) => row?.payslip?.status ? row.payslip.status : 'N/A' },
        { id: 'period', label: 'Period', minWidth: 120, align: 'center', getter: (row) => row?.payslip?.period ? row.payslip.period : 'N/A' },
        { id: 'lossofpay', label: 'LOP', minWidth: 100, align: 'center', getter: (row) => row?.payslip?.LossOfPay },
        { id: 'ESI', label: 'ESI', minWidth: 100, getter: (row) => row?.payslip?.ESI || 'N/A' },
        { id: 'ProvidentFund', label: 'ProvidentFund', minWidth: 100, getter: (row) => row?.payslip?.ProvidentFund || 'N/A' },
        { id: "Action", label: "Action", minWidth: 100, align: "center" }
    ];

    const column3 = [
        {
            id: 'FirstName',
            label: 'Profile',
            minWidth: 150,
            align: 'left',
            getter: (row) => {
                const firstName = row?.FirstName || '';
                const lastName = row?.LastName || '';
                const profileImg = row?.profile || profile;

                const fullName = firstName
                    ? firstName[0].toUpperCase() + firstName.slice(1) + ' ' + lastName
                    : 'Unknown';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={profileImg}
                            alt="Profile"
                            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <span>{fullName}</span>
                    </div>
                );
            }
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
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.workingTimePattern?.PatternName || 'N/A'
        },
        {
            id: 'dateOfJoining',
            label: 'Joining Date',
            minWidth: 130,
            align: 'center',
            getter: (row) => new Date(row?.dateOfJoining).toLocaleDateString() || 'N/A'
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
        {
            id: 'FirstName',
            label: 'Profile',
            minWidth: 150,
            align: 'left',
            getter: (row) => {
                const firstName = row?.employee?.FirstName || '';
                const lastName = row?.employee?.LastName || '';
                const profileImg = row?.employee?.profile || profile;

                const fullName = firstName
                    ? firstName[0].toUpperCase() + firstName.slice(1) + ' ' + lastName
                    : 'Unknown';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={profileImg}
                            alt="Profile"
                            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <span>{fullName}</span>
                    </div>
                );
            }
        }
        ,
        {
            id: 'date',
            label: 'Date',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.date ? new Date(row.date).toLocaleDateString() : "no date"
        },
        {
            id: 'punchIn',
            label: 'Punch In',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.login?.startingTime ? row?.login?.startingTime[0] : "00:00:00"
        },
        {
            id: 'punchOut',
            label: 'Punch Out',
            minWidth: 130,
            align: 'center',
            getter: (row) => row?.login?.endingTime ? row.login.endingTime[row.login.endingTime.length - 1] : "00:00:00"
        },
        {
            id: 'timeHolder',
            label: 'Total Hour',
            minWidth: 130,
            align: 'center',
            getter: (row) => {
                return row?.login?.timeHolder || "00:00:00"
            }
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
        { id: 'Name', label: 'Name', minWidth: 130, align: 'left', getter: (row) => row?.Name || row.employee.FirstName + " " + row.employee.LastName || 'N/A' },
        {
            id: 'date',
            label: 'Date',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.date ? new Date(row.date).toLocaleDateString() : "no date"
        },
        {
            id: 'type',
            label: 'Type',
            minWidth: 150,
            align: 'left',
            getter: (row) => row.type || "login"
        },
        {
            id: 'punchIn',
            label: 'Punch In',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.punchIn || row?.login?.startingTime[0]
        },
        {
            id: 'punchOut',
            label: 'Punch Out',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.punchOut || row?.login?.endingTime[row.login.endingTime.length - 1]
        },
        {
            id: 'totalHour',
            label: 'Total Hour',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.[row.type]?.totalHour || "00:00:00"
        },
        {
            id: 'behaviour',
            label: 'Behaviour',
            minWidth: 130,
            align: 'left',
            getter: (row) => row?.behaviour || 0
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
        {
            id: 'FirstName',
            label: 'Name',
            minWidth: 150,
            align: 'left',
            getter: (row) => {
                const firstName = row?.employee?.FirstName || '';
                const lastName = row?.employee?.LastName || '';
                const profileImg = row?.employee?.profile || profile;

                const fullName = firstName
                    ? firstName[0].toUpperCase() + firstName.slice(1) + ' ' + lastName
                    : 'Unknown';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={profileImg}
                            alt="Profile"
                            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <span>{fullName}</span>
                    </div>
                );
            }
        },
        { id: 'periodOfLeave', label: 'Period Of Leave', align: "left", minWidth: 150, getter: (row) => row.periodOfLeave },
        { id: 'fromDate', label: 'Start Date', minWidth: 130, align: 'left', getter: (row) => row.fromDate ? new Date(row.fromDate).toLocaleDateString() : 'N/A' },
        { id: 'toDate', label: 'End Date', minWidth: 130, align: 'left', getter: (row) => row.toDate ? new Date(row.toDate).toLocaleDateString() : 'N/A' },
        { id: 'leaveType', label: 'Type', minWidth: 100, align: 'left', getter: (row) => row.leaveType },
        { id: 'reasonForLeave', label: 'Reason', minWidth: 150, align: 'left', getter: (row) => row.reasonForLeave.slice(0, 20) + (row?.reasonForLeave?.length > 20 ? "..." : "") },
        { id: 'status', label: 'Status', minWidth: 100, align: 'left', getter: (row) => row.status },
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
        { id: 'startDate', label: 'Start Date', minWidth: 130, align: 'left', getter: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : 'N/A' },
        { id: 'endDate', label: 'End Date', minWidth: 130, align: 'left', getter: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : 'N/A' },
        { id: 'message', label: 'Message', minWidth: 200, align: 'left', getter: (row) => row.message.replace(/<[^>]*>/g, "") || 'No message' },
        { id: 'Action', label: 'Action', minWidth: 100, align: 'center' },
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
            getter: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : 'N/A',
        },
        {
            id: 'endDate',
            label: 'End Date',
            minWidth: 130,
            align: 'left',
            getter: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : 'N/A',
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
        { id: 'states', label: 'States', minWidth: 130, align: "left", getter: (row) => row?.states?.length ? row.states.slice(0, 3).join(", ") + (row.states.length > 3 ? "..." : "") : "N/A" },
        { id: "Action", label: "Action", minWidth: 100, align: "center" }
    ];

    const column15 = [
        {
            id: 'orgName',
            label: 'Organization Name',
            minWidth: 150,
            align: 'left',
            getter: (row) => row?.orgName
        },
        {
            id: 'createdAt',
            label: 'Created At',
            minWidth: 150,
            align: 'center',
            getter: (row) => row?.createdAt ? row?.createdAt.split("T")[0] : "N/A"
        },
        {
            id: 'expireAt',
            label: 'Expire At',
            minWidth: 150,
            align: 'center',
            getter: (row) => row?.expireAt ? row?.expireAt.split("T")[0] : "N/A"
        },
        {
            id: 'members',
            label: 'Members',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.members ? row.members.length : 0
        },
        {
            id: 'createdBy',
            label: 'Created By',
            minWidth: 150,
            align: 'center',
            getter: (row) => row?.createdBy?.name ? row?.createdBy?.name[0].toUpperCase() + row?.createdBy?.name.slice(1) : "N/A"
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.status ? row.status : "N/A"
        }, {
            id: "Action",
            label: "Action",
            minWidth: 60,
            align: "center"
        },
    ];

    const column16 = [
        {
            id: 'name',
            label: 'Name',
            minWidth: 150,
            align: 'left',
            getter: (row) => row?.name
                ? row.name[0].toUpperCase() + row.name.slice(1)  // Capitalize first letter
                : "N/A"
        },
        {
            id: 'email',
            label: 'Email',
            minWidth: 200,
            align: 'center',
            getter: (row) => row?.email || "N/A"
        },
        {
            id: 'password',
            label: 'Password',
            minWidth: 150,
            align: 'center',
            getter: (row) => row?.password ? row.password : "N/A" // Mask password for security
        },
        {
            id: "Action",
            label: "Action",
            minWidth: 100,
            align: "center"
        }
    ];

    const column17 = [
        {
            id: 'LeaveName',
            label: 'Leave Name',
            minWidth: 150,
            getter: (row) => row?.LeaveName || 'N/A'
        },
        {
            id: 'limitDays',
            label: 'Limit Days',
            minWidth: 100,
            align: 'center',
            getter: (row) => row?.limitDays || 'N/A'
        },
        {
            id: 'Description',
            label: 'Description',
            minWidth: 200,
            align: "center",
            getter: (row) => row?.Description || 'N/A'
        },
        {
            id: "Action",
            label: "Action",
            minWidth: 100,
            align: "center"
        }
    ];

    const column18 = [
        { id: 'PatternName', label: 'Pattern Name', minWidth: 120, align: 'center', getter: (row) => row?.PatternName || 'N/A' },
        { id: 'StartingTime', label: 'Start Time', minWidth: 100, align: 'center', getter: (row) => new Date(row?.StartingTime).toLocaleTimeString() || 'N/A' },
        { id: 'FinishingTime', label: 'End Time', minWidth: 100, align: 'center', getter: (row) => new Date(row?.FinishingTime).toLocaleTimeString() || 'N/A' },
        { id: 'BreakTime', label: 'Break Time', minWidth: 100, align: 'center', getter: (row) => row?.BreakTime || 'N/A' },
        { id: 'WaitingTime', label: 'Waiting Time', minWidth: 100, align: 'center', getter: (row) => row?.WaitingTime || 'N/A' },
        { id: 'WeeklyDays', label: 'Weekly Days', minWidth: 150, align: 'center', getter: (row) => row.WeeklyDays.length ? row.WeeklyDays.slice(0, 3).join(", ") + (row.WeeklyDays.length > 3 ? "..." : "") : 'N/A' },
        { id: 'Action', label: 'Action', minWidth: 100, align: 'center' }
    ];
    const column19 = [
        { id: 'CompanyName', label: 'Company Name', minWidth: 150, align: 'center', getter: (row) => row?.CompanyName || 'N/A' },
        { id: 'Address_1', label: 'Address', minWidth: 200, align: 'center', getter: (row) => row?.Address_1 || 'N/A' },
        { id: 'PostCode', label: 'Postcode', minWidth: 100, align: 'center', getter: (row) => row?.PostCode || 'N/A' },
        {
            id: 'employees',
            label: 'Employees',
            minWidth: 200,
            align: 'center',
            getter: (row) =>
                Array.isArray(row?.employees) && row.employees.length ? row.employees.length : 0
        },
        { id: 'Action', label: 'Action', minWidth: 100, align: 'center' }
    ];

    const column20 = [
        {
            id: 'FirstName',
            label: 'Name',
            minWidth: 150,
            align: 'left',
            getter: (row) => {
                const firstName = row?.employee?.FirstName || '';
                const lastName = row?.employee?.LastName || '';
                const profileImg = row?.employee?.profile || profile;

                const fullName = firstName
                    ? firstName[0].toUpperCase() + firstName.slice(1) + ' ' + lastName
                    : 'Unknown';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={profileImg}
                            alt="Profile"
                            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <span>{fullName}</span>
                    </div>
                );
            }
        },
        {
            id: 'fromDate',
            label: 'From Date',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.fromDate
                ? new Date(row.fromDate).toLocaleDateString()
                : 'N/A'
        },
        {
            id: 'toDate',
            label: 'To Date',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.toDate
                ? new Date(row.toDate).toLocaleDateString()
                : 'N/A'
        },
        {
            id: 'reason',
            label: 'Reason',
            minWidth: 200,
            align: 'center',
            getter: (row) => row?.reason.slice(0, 20) + (row?.reason?.length > 20 ? "..." : "") || 'N/A'
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            getter: (row) => {
                if (isTeamHead) {
                    return row?.approvers?.head || "N/A";
                } else if (isTeamLead) {
                    return row?.approvers?.lead || "N/A";
                } else if (isTeamManager) {
                    return row?.approvers?.manager || "N/A";
                } else if (Account === "2") {
                    return row?.approvers?.hr || "N/A";
                } else {
                    return row.status;
                }
            }
        },
        {
            id: 'numOfDays',
            label: 'Number of Days',
            minWidth: 100,
            align: 'center',
            getter: (row) => row?.numOfDays !== undefined
                ? row.numOfDays
                : 'N/A'
        },
        {
            id: 'Action',
            label: 'Action',
            minWidth: 100,
            align: 'center'
        }
    ];

    const column21 = [
        {
            id: 'title',
            label: 'Title',
            minWidth: 180,
            align: 'left',
            getter: (row) => row?.title || 'Untitled'
        },
        {
            id: 'subject',
            label: 'Subject',
            minWidth: 200,
            align: 'left',
            getter: (row) => row?.subject || 'No Subject'
        },
        {
            id: 'shortTags',
            label: 'ShortTags',
            minWidth: 180,
            align: 'center',
            getter: (row) => Array.isArray(row?.shortTags)
                ? row.shortTags.slice(0, 3).join(', ') + (row.shortTags.length > 3 ? "..." : "")
                : row?.shortTags || 'N/A'
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.status ? "true" : 'false'
        },
        {
            id: "Action",
            label: "Action",
            minWidth: 100,
            align: "center"
        }
    ];

    const column22 = [
        { id: 'currentYear', label: 'Year', minWidth: 100, align: 'left', getter: (row) => row.currentYear || "N/A" },
        { id: 'holidays', label: 'Holidays', minWidth: 400, align: 'center', getter: (row) => row.holidays.length ? row.holidays?.slice(0, 3).map((holiday) => holiday.date + ", ") + (row.holidays.length > 3 ? "..." : "") : "N/A" },
        { id: "Action", label: "Action", minWidth: 100, align: "center" }
    ]

    const column23 = [
        {
            id: 'title',
            label: 'Task Name',
            minWidth: 150,
            align: 'center',
            getter: (row) => row?.title || 'N/A'
        },
        {
            id: 'from',
            label: 'Active',
            minWidth: 80,
            align: 'center',
            getter: (row) => row?.from ? new Date(row.from).toLocaleDateString() : 'N/A'
        },
        {
            id: 'to',
            label: 'Deadline',
            minWidth: 120,
            align: 'center',
            getter: (row) => row?.to ? new Date(row.to).toLocaleDateString() : 'N/A'
        },
        {
            id: 'createdby',
            label: 'Created By',
            minWidth: 150,
            align: 'center',
            getter: (row) => {
                const creator = row?.createdby;
                return creator?.FirstName ? `${creator.FirstName} ${creator.LastName || ''}`.trim() : 'N/A';
            }
        },
        {
            id: 'assignedTo',
            label: 'Assignee(s)',
            minWidth: 180,
            align: 'center',
            getter: (row) => {
                const assignees = row?.assignedTo || [];
                if (!assignees.length) return 'N/A';
                return assignees.slice(0, 2).map(emp => `${emp.FirstName} ${emp.LastName || ''}`.trim()).join(', ') + (assignees.length > 3 ? "..." : "");
            }
        },
        {
            id: 'project',
            label: 'Project',
            minWidth: 150,
            align: 'center',
            getter: (row) => row?.project?.name || 'N/A'
        },
        {
            id: 'tags',
            label: 'Tags',
            minWidth: 150,
            align: 'center',
            getter: (row) => Array.isArray(row.tags) && row.tags.length ? row.tags.join(', ') : 'N/A'
        },
        {
            id: 'Action',
            label: 'Action',
            minWidth: 100,
            align: 'center'
        }
    ];


    function toggleView() {
        setOpenModal(!openModal);
    }

    function getValueForView(value) {
        const [id, page] = value;

        if (['daily-log', "attendance-request"].includes(page)) {
            async function fetchAttendanceData() {
                try {
                    const res = await getclockinsDataById(id);

                    setModelData({
                        ...res.timeData,
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
            if (item?.fromDate && ["leave-request", "leave", "unpaid-request"].includes(params['*'])) {
                return setColumns(column1);
            } else if (item?.FirstName && params["*"] === "employee") {
                return setColumns(column3);
            } else if ((item?.date && params['*'] === "attendance-summary")
                || (item?.date && params['*'] === "details")
                || (item?.date && params['*'] === "attendance")
            ) {
                return setColumns(column5);
            } else if ((item?.date && params['*'] === "attendance-request") || item?.date) {
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
            } else if (item?.title && params["*"] === "announcement") {
                return setColumns(column11)
            } else if (params["*"] === "" && item.title) {
                setColumns(column23)
            }
            else if (item?.CompanyName && params["*"] === "company") {
                return setColumns(column13)
            } else if (item?.icon) {
                return setColumns(column14)
            } else if (item?.orgName) {
                return setColumns(column15)
            } else if (params["*"] === "users" || item.Name) {
                return setColumns(column16)
            } else if (params["*"] === "leave-details" && item.LeaveName) {
                return setColumns(column17)
            } else if (item.PatternName) {
                return setColumns(column18)
            } else if (item.Address_1 && item.PostCode) {
                return setColumns(column19)
            } else if (item.reason) {
                return setColumns(column20);
            } else if (params["*"] === "email-templates") {
                return setColumns(column21)
            } else if (params["*"] === "holiday") {
                setColumns(column22);
            } else if (item?.createdby && params["*"] === "reports") {
                return setColumns(column12)
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
                                            const cellStyle =
                                                column.id === "employmentType" && ["contract", "intern"].includes(value) ? {
                                                    color: "white", background: "#3A59D1",
                                                    padding: "0px",
                                                    fontWeight: "bold"
                                                } :
                                                    column.id === "employmentType" && value?.toLowerCase() === "part-time" ? {
                                                        color: "white", background: "#FFB22C",
                                                        padding: "0px",
                                                        fontWeight: "bold",
                                                        borderRadius: "4px"
                                                    } :
                                                        column.id === "employmentType" && value?.toLowerCase() === "full-time" ? {
                                                            color: "white", background: "#0A7E22",
                                                            padding: "0px",
                                                            fontWeight: "bold",
                                                            borderRadius: "4px"
                                                        } : {};

                                            // Render actions based on column.id and params
                                            const renderActions = () => {
                                                if (column.id === "reasonForLeave") {
                                                } else if (column.id === "Action") {
                                                    if (["leave-request", "wfh-request"].includes(params['*'])) {
                                                        return (
                                                            <Dropdown placement='leftStart' title={isLoading === row._id ? <Loading size={20} color={"black"} /> : <EditRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} noCaret>
                                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => navigate(params['*'] === "leave-request" ? `/${whoIs}/leave-request/view/${row._id}` : `/${whoIs}/wfh-request/view/${row._id}`)}>View</Dropdown.Item>
                                                                {
                                                                    (isTeamLead && row?.approvers?.lead === "pending") ||
                                                                        (isTeamHead && row?.approvers?.head === "pending") ||
                                                                        (whoIs === "manager" && row?.approvers?.manager === "pending") ||
                                                                        (whoIs === "hr" && row?.approvers?.hr === "pending") ||
                                                                        (whoIs === "admin" && row?.status === "pending") ? (
                                                                        <>
                                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => replyToLeave(row, "approved")}>Approve</Dropdown.Item>
                                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => replyToLeave(row, "rejected")}>Reject</Dropdown.Item>
                                                                        </>
                                                                    ) : null
                                                                }
                                                            </Dropdown>
                                                        );
                                                    } else if (params["*"] === "unpaid-request") {
                                                        return (<Dropdown placement='leftStart' title={isLoading === row._id ? <Loading size={20} color={"black"} /> : <EditRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} noCaret>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => replyToLeave(row, "approved")}>Approve</Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => replyToLeave(row, "rejected")}>Reject</Dropdown.Item>
                                                        </Dropdown>)
                                                    }
                                                    else if (["payslip", "daily-log", "attendance-request"].includes(params["*"])) {
                                                        return (
                                                            <Dropdown title={<RemoveRedEyeRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} noCaret onClick={() => getValueForView([row._id, params['*']])}>
                                                            </Dropdown>
                                                        );
                                                    } else if (params["*"] === "workFromHome") {
                                                        return (
                                                            <Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : <EditRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} placement='leftStart' noCaret>
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => navigate(`/${whoIs}/wfh-request/view/${row._id}`)}>
                                                                    <b>
                                                                        <RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View
                                                                    </b>
                                                                </Dropdown.Item>
                                                                {row.status === "pending" ?
                                                                    <>
                                                                        <Dropdown.Item style={{ minWidth: 120 }} onClick={() => navigate(`/${whoIs}/wfh-request/edit/${row._id}`)}>
                                                                            <b>
                                                                                <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                            </b>
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item style={{ minWidth: 120 }} onClick={() => deleteData(row._id)}>
                                                                            <b>
                                                                                <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                            </b>
                                                                        </Dropdown.Item>
                                                                    </> : null}
                                                            </Dropdown>
                                                        );
                                                    } else if (params['*'] === "employee") {
                                                        return (
                                                            <Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : <EditRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} placement='leftStart' noCaret>
                                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => timerStateData?.changeEmpEditForm(row._id)}>
                                                                    <b>
                                                                        <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                    </b>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => deleteData(row._id)}>
                                                                    <b>
                                                                        <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                    </b>
                                                                </Dropdown.Item>
                                                            </Dropdown>
                                                        );
                                                    } else if (params["*"] === "reports") {
                                                        return (
                                                            <Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : "Action"} placement='leftStart' noCaret>
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

                                                    } else if (params["*"] === "leave-details") {
                                                        return (
                                                            <Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : "Action"} placement='leftStart' noCaret>
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleChangeLeavetype("Edit", row)}>
                                                                    <b>
                                                                        <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                    </b>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleChangeLeavetype("Delete", row)}>
                                                                    <b>
                                                                        <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                    </b>
                                                                </Dropdown.Item>
                                                            </Dropdown>
                                                        )
                                                    } else if (params["*"] === "leave") {
                                                        return (<Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : "Action"} noCaret placement="leftStart">
                                                            <Dropdown.Item style={{ minWidth: 80 }} onClick={() => navigate(`/${whoIs}/leave-request/view/${row._id}`)}>
                                                                <b>
                                                                    <RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View
                                                                </b>
                                                            </Dropdown.Item>
                                                            {
                                                                row.status === "pending" && row.leaveType !== "Unpaid Leave (LWP)" ?
                                                                    <>
                                                                        <Dropdown.Item style={{ minWidth: 80 }} onClick={() => navigate(`/${whoIs}/leave-request/edit/${row._id}`)}>
                                                                            <b>
                                                                                <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                            </b>
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item style={{ minWidth: 80 }} onClick={() => fetchData(row._id, "delete")}>
                                                                            <b>
                                                                                <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                            </b>
                                                                        </Dropdown.Item>
                                                                    </> : null
                                                            }
                                                        </Dropdown>)
                                                    } else if (["organizations", "users", "announcement"].includes(params["*"])) {
                                                        return (<Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : "Action"} placement='leftStart' noCaret>
                                                            {["organizations", "users"].includes(params["*"])
                                                                &&
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => fetchOrgData(row._id, "Edit")}>
                                                                    <b>
                                                                        <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                    </b>
                                                                </Dropdown.Item>
                                                            }
                                                            {
                                                                ["organizations", "users", "announcement"].includes(params["*"]) &&
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleDelete(row)}>
                                                                    <b>
                                                                        <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                    </b>
                                                                </Dropdown.Item>
                                                            }
                                                        </Dropdown>);
                                                    } else if (["profile", "holiday"].includes(params["*"])) { // for time pattern
                                                        return (<Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : "Action"} placement='leftStart' noCaret>
                                                            {
                                                                params["*"] === "profile" &&
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleChangeData("View", row)}>
                                                                    <b>
                                                                        <RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View
                                                                    </b>
                                                                </Dropdown.Item>
                                                            }
                                                            <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleChangeData("Edit", row)}>
                                                                <b>
                                                                    <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                </b>
                                                            </Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 80 }} onClick={() => deleteData(row._id)}>
                                                                <b>
                                                                    <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                </b>
                                                            </Dropdown.Item>
                                                        </Dropdown>)
                                                    } else if (["email-templates"].includes(params["*"])) {
                                                        return (
                                                            <Dropdown title={<EditRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} placement='leftStart' noCaret>
                                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => handleChangeData("Edit", row)}>
                                                                    <b>
                                                                        <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                    </b>
                                                                </Dropdown.Item>
                                                            </Dropdown>
                                                        );
                                                    } else if (params["*"] === "") {
                                                        return (
                                                            <Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : "Action"} placement='leftStart' noCaret>
                                                                <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleView(row?._id)}>
                                                                    <b>
                                                                        <RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View
                                                                    </b>
                                                                </Dropdown.Item>
                                                                {
                                                                    empId === row?.createdby?._id &&
                                                                    <>
                                                                        <Dropdown.Item style={{ minWidth: 80 }} onClick={() => handleEdit(row?._id)}>
                                                                            <b>
                                                                                <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                            </b>
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item style={{ minWidth: 80 }} onClick={() => deleteData(row._id)}>
                                                                            <b>
                                                                                <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                                                                            </b>
                                                                        </Dropdown.Item>
                                                                    </>
                                                                }
                                                            </Dropdown>
                                                        )
                                                    }
                                                } else if (column.id === "auth") {
                                                    return (
                                                        <Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : <KeyRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} placement='leftStart' noCaret>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => navigate(`view/${row._id}`)}><RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View</Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => navigate(`edit/${row._id}`)}><BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit</Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => deleteData(row._id)}><DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete</Dropdown.Item>
                                                        </Dropdown>
                                                    );
                                                } else if (["department", "position", "company"].includes(params["*"])) {
                                                    return (
                                                        <Dropdown title={isLoading === row._id ? <Loading size={20} color={"black"} /> : <EditRoundedIcon style={{ cursor: isLoading === row._id ? "process" : "pointer" }} />} placement='leftStart' noCaret>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => fetchData(row._id)}>
                                                                <b>
                                                                    <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                                                                </b>
                                                            </Dropdown.Item>
                                                            <Dropdown.Item style={{ minWidth: 120 }} onClick={() => deleteData(row._id)}>
                                                                <b>
                                                                    <DeleteRoundedIcon sx={{ color: "#F93827" }} />
                                                                    Delete
                                                                </b>
                                                            </Dropdown.Item>
                                                        </Dropdown>
                                                    );
                                                }
                                                return <p>N/A</p>;
                                            };

                                            return (
                                                <TableCell
                                                    key={column.id}
                                                    align={column.align}
                                                    style={cellStyle}
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
