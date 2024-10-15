import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import './sidebar.css';
import KeyboardArrowDownSharpIcon from '@mui/icons-material/KeyboardArrowDownSharp';
import settingsIcon from "../../../asserts/settingsIcon.svg";
import jobDeskIcon from "../../../asserts/jobDeskIcon.svg";
import userIcon from "../../../asserts/userIcon.svg";
import leaveIcon from "../../../asserts/leaveIcon.svg";
import attendanceIcon from "../../../asserts/attendanceIcon.svg";
import adminIcon from "../../../asserts/adminIcon.svg";
import homeIcon from "../../../asserts/homeIcon.svg";

const Sidebar = ({ handleLogout, whoIs }) => {
    const account = localStorage.getItem("Account");
    const param = useParams();
    const [activeSubmenu, setActiveSubmenu] = useState(param['*']);
    const [activeNavLink, setActiveNavLink] = useState();
    const [isOpen, setIsOpen] = useState(true);

    function toggleActiveLink(name) {
        if (activeNavLink === name) {
            setActiveNavLink("")
        } else {
            setActiveNavLink(name)
        }
    }

    function handleActiveMenu(nav) {
        setActiveNavLink(nav);
        setActiveSubmenu("")
    }
    return (
            <div style={{ width: isOpen ? "250px" : "50px" }} className="sidebar sidebar_hrm">
                <ul className="sidebar-nav p-0" id="sidebar-nav">

                    {/* Dashboard Link */}
                    <li className={`${activeNavLink === "dashboard" ? "active" : "nav-item"}`} onClick={() => handleActiveMenu("dashboard")}>
                        <NavLink className="nav-link" to={`/${whoIs}`}>
                            <span className="p-0 m-0">
                                <img src={homeIcon} alt="Dashboard Icon" />
                            </span>
                            <span className="sideBarTxt">Dashboard</span>
                        </NavLink>
                    </li>

                    {/* Job Desk Link */}
                    <li className={`${activeNavLink === "jobDesk" ? "active" : "nav-item"}`} onClick={() => handleActiveMenu("jobDesk")}>
                        <NavLink className="nav-link" to={`/${whoIs}/job-desk/attendance`}>
                            <span className="p-0 m-0">
                                <img src={jobDeskIcon} alt="Job Desk Icon" />
                            </span>
                            <span className="sideBarTxt">Job Desk</span>
                        </NavLink>
                    </li>

                    {/* Employee Link */}
                    <li className={`${activeNavLink === "employee" ? "active" : "nav-item"}`} onClick={() => handleActiveMenu("employee")}>
                        <NavLink className="nav-link" to={`/${whoIs}/employee`}>
                            <span className="p-0 m-0">
                                <img src={userIcon} alt="Employee Icon" />
                            </span>
                            <span className="sideBarTxt">Employee</span>
                        </NavLink>
                    </li>

                    {(account === '2' || account === '1') && (
                        <>
                            {/* Leave Section */}
                            <li className={`nav-item`} >
                                <NavLink className={`nav-link ${activeNavLink === "leave" ? "active" : ""}`} onClick={() => toggleActiveLink("leave")}>
                                    <span className="p-0 m-0">
                                        <img src={leaveIcon} alt="Leave Icon" />
                                    </span>
                                    <span className="sideBarTxt">Leave</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                {activeNavLink === "leave" && (
                                    <ul className="nav-content p-2">
                                        <li className={`submenu_navlist ${activeSubmenu === "status" ? "active" : ""}`} onClick={() => setActiveSubmenu("status")}>
                                            <NavLink to={`/${whoIs}/leave/status`} className="nav-lists">Status</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "leave-request" ? "active" : ""}`} onClick={() => setActiveSubmenu("leave-request")}>
                                            <NavLink to={`/${whoIs}/leave/leave-request`} className="nav-lists">Request</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "calendar" ? "active" : ""}`} onClick={() => setActiveSubmenu("calendar")}>
                                            <NavLink to={`/${whoIs}/leave/calender`} className="nav-lists">Calendar</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "leave-summary" ? "active" : ""}`} onClick={() => setActiveSubmenu("leave-summary")}>
                                            <NavLink to={`/${whoIs}/leave/leave-summary`} className="nav-lists">Summary</NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                            {/* Attendance Section */}
                            <li className={`nav-item`} >
                                <NavLink className={`nav-link ${activeNavLink === "attendance" ? "active" : ""}`} onClick={() => toggleActiveLink("attendance")}>
                                    <span className="p-0 m-0">
                                        <img src={attendanceIcon} alt="Attendance Icon" />
                                    </span>
                                    <span className="sideBarTxt">Attendance</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                {activeNavLink === "attendance" && (
                                    <ul className="nav-content p-2">
                                        <li className={`submenu_navlist ${activeSubmenu === "daily-log" ? "active" : ""}`} onClick={() => setActiveSubmenu("daily-log")}>
                                            <NavLink to={`/${whoIs}/attendance/daily-log`} className="nav-lists">Daily Log</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "attendance-request" ? "active" : ""}`} onClick={() => setActiveSubmenu("attendance-request")}>
                                            <NavLink to={`/${whoIs}/attendance/attendance-request`} className="nav-lists">Request</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "details" ? "active" : ""}`} onClick={() => setActiveSubmenu("details")}>
                                            <NavLink to={`/${whoIs}/attendance/details`} className="nav-lists">Details</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "attendance-summary" ? "active" : ""}`} onClick={() => setActiveSubmenu("attendance-summary")}>
                                            <NavLink to={`/${whoIs}/attendance/attendance-summary`} className="nav-lists">Summary</NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </>
                    )}


                    {/* Administration Section */}
                    {account === "1" && (
                        <>
                            <li className={`nav-item`} >
                                <NavLink className={`nav-link ${activeNavLink === "administration" ? "active" : ""}`} onClick={() => toggleActiveLink("administration")}>
                                    <span className="p-0 m-0">
                                        <img src={adminIcon} alt="Admin Icon" />
                                    </span>
                                    <span className="sideBarTxt">Administration</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                {activeNavLink === "administration" && (
                                    <ul className="nav-content p-2">
                                        <li className={`submenu_navlist ${activeSubmenu === "Role" ? "active" : ""}`} onClick={() => setActiveSubmenu("Role")}>
                                            <NavLink to={`/${whoIs}/administration/role`} className="nav-lists">Role</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "Department" ? "active" : ""}`} onClick={() => setActiveSubmenu("Department")}>
                                            <NavLink to={`/${whoIs}/administration/department`} className="nav-lists">Department</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "Holiday" ? "active" : ""}`} onClick={() => setActiveSubmenu("Holiday")}>
                                            <NavLink to={`/${whoIs}/administration/holiday`} className="nav-lists">Holiday</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "Announcement" ? "active" : ""}`} onClick={() => setActiveSubmenu("Announcement")}>
                                            <NavLink to={`/${whoIs}/administration/announcement`} className="nav-lists">Announcement</NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                            {/* Settings Section */}
                            <li className={`nav-item`} >
                                <NavLink className={`nav-link ${activeNavLink === "settings" ? "active" : ""}`} onClick={() => toggleActiveLink("settings")}>
                                    <span className="p-0 m-0">
                                        <img src={settingsIcon} alt="Settings Icon" />
                                    </span>
                                    <span className="sideBarTxt">Settings</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                {activeNavLink === "settings" && (
                                    <ul className="nav-content p-2">
                                        <li className={`submenu_navlist ${activeSubmenu === "Profile" ? "active" : ""}`} onClick={() => setActiveSubmenu("Profile")}>
                                            <NavLink to={`/${whoIs}/settings/`} className="nav-lists">General</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "Account" ? "active" : ""}`} onClick={() => setActiveSubmenu("Account")}>
                                            <NavLink to={`/${whoIs}/settings/account`} className="nav-lists">Account</NavLink>
                                        </li>
                                        <li className={`submenu_navlist ${activeSubmenu === "Payroll" ? "active" : ""}`} onClick={() => setActiveSubmenu("Payroll")}>
                                            <NavLink to={`/${whoIs}/settings/payroll`} className="nav-lists">Payroll</NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </>
                    )}


                </ul>
                <div class="logOutBtnParent p-3" onClick={handleLogout}>
                    <button class="w-100 log_out">Logout</button>
                </div>
            </div>
    );
};

export default Sidebar;
