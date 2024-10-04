import React from "react";
import "./payslip.css";
import { Link } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import WorkOutlineSharpIcon from '@mui/icons-material/WorkOutlineSharp';
import AccountCircleSharpIcon from '@mui/icons-material/AccountCircleSharp';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import TimerSharpIcon from '@mui/icons-material/TimerSharp';
import FolderOpenSharpIcon from '@mui/icons-material/FolderOpenSharp';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';

const PayslipSidebar = (props) => {
    return (
        <div className="sidetext">
            <ul className="sidebar-nav scrollbar p-0" id="sidebar-nav">
                <li className="nav-item ">
                    <Link className="nav-link" to="/admin">
                        <HomeIcon />
                        <span className="ms-2">Dashboard</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link
                        className="nav-link collapsed"
                        data-bs-target="#Management"
                        data-bs-toggle="collapse"
                        to="#"
                    >
                        <span className="ms-2">Job</span>
                    </Link>
                    <ul
                        id="Management"
                        className="nav-content collapse "
                        data-bs-parent="#sidebar-nav"
                    >
                        <li>
                            <Link to="/jobdesk" className="nav-lists">
                                <span className="ms-2">Jobs details</span>
                            </Link>
                        </li>

                    </ul>
                </li>
                <li className="nav-item">
                    <Link className="nav-link collapsed" to="/jobdesk">
                        <WorkOutlineSharpIcon />
                        <span className="ms-2">Job Desk</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link collapsed" to="/employee">
                        <AccountCircleSharpIcon />
                        <span className="ms-2">Employee</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link collapsed" to="/Leave">
                        <FirstPageIcon />
                        <span className="ms-2">Leave</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link collapsed" to="/Attendance">
                        <TimerSharpIcon />
                        <span className="ms-2">Attendance</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link collapsed" to="/Administration">
                        <FolderOpenSharpIcon />
                        <span className="ms-2">Administration</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link collapsed" to="/Setting">
                        <SettingsApplicationsIcon />
                        <span className="ms-2">Setting</span>
                    </Link>
                </li>
            </ul>
        </div>
    )
};

export default PayslipSidebar;
