import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
    const [activeSubmenu, setActiveSubmenu] = useState("");
    const [isOpen, setIsOpen] = useState(true);

    // Helper function components
    const renderLeaveSubMenu = (submenu, label, path) => (
        <li className={activeSubmenu === submenu ? "submenu_navlist active" : "submenu_navlist"}
            onClick={() => setActiveSubmenu(submenu)}>
            <NavLink to={path} className="nav-lists">{label}</NavLink>
        </li>
    );

    const renderAttendanceSubMenu = (submenu, label, path) => (
        <li className={activeSubmenu === submenu ? "submenu_navlist active" : "submenu_navlist"}
            onClick={() => setActiveSubmenu(submenu)}>
            <NavLink to={path} className="nav-lists">{label}</NavLink>
        </li>
    );

    const renderAdminSubMenu = (submenu, label, path) => (
        <li className={activeSubmenu === submenu ? "submenu_navlist active" : "submenu_navlist"}
            onClick={() => setActiveSubmenu(submenu)}>
            <NavLink to={path} className="nav-lists">{label}</NavLink>
        </li>
    );

    const renderSettingsSubMenu = (submenu, label, path) => (
        <li className={activeSubmenu === submenu ? "submenu_navlist active" : "submenu_navlist"}
            onClick={() => setActiveSubmenu(submenu)}>
            <NavLink to={path} className="nav-lists">{label}</NavLink>
        </li>
    );

    return (
        <div className="d-flex sidebar_hrm padding_top">
            <div style={{ width: isOpen ? "250px" : "50px" }} className="sidebar">
                <ul className="sidebar-nav p-0" id="sidebar-nav">
                    <li className="nav-item">
                        <NavLink className="nav-link" to={`/${whoIs}`}>
                            <span className="p-0 m-0">
                                <img src={homeIcon} alt="Dashboard Icon" />
                            </span>
                            <span className="sideBarTxt">Dashboard</span>
                        </NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink className="nav-link" to={`/${whoIs}/job-desk`}>
                            <span className="p-0 m-0">
                                <img src={jobDeskIcon} alt="Job Desk Icon" />
                            </span>
                            <span className="sideBarTxt">Job Desk</span>
                        </NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink className="nav-link" to={`/${whoIs}/employee`}>
                            <span className="p-0 m-0">
                                <img src={userIcon} alt="Employee Icon" />
                            </span>
                            <span className="sideBarTxt">Employee</span>
                        </NavLink>
                    </li>

                    {account === '2' && (
                        <>
                            {/* Leave section */}
                            <li className="nav-item">
                                <NavLink className="nav-link collapsed" data-bs-target="#leave-hrmmanage" data-bs-toggle="collapse" to="#">
                                    <span className="p-0 m-0">
                                        <img src={leaveIcon} alt="Leave Icon" />
                                    </span>
                                    <span className="sideBarTxt">Leave</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                <ul id="leave-hrmmanage" className="nav-content collapse p-2" data-bs-parent="#sidebar-nav">
                                    {renderLeaveSubMenu("leaveStatus", "Status", `/${whoIs}/leave/status`)}
                                    {renderLeaveSubMenu("leaveRequest", "Request", `/${whoIs}/leave/request`)}
                                    {renderLeaveSubMenu("leaveCalendar", "Calendar", `/${whoIs}/leave/calender`)}
                                    {renderLeaveSubMenu("leaveSummary", "Summary", `/${whoIs}/leave/summary`)}
                                </ul>
                            </li>

                            {/* Attendance section */}
                            <li className="nav-item">
                                <NavLink className="nav-link collapsed" data-bs-target="#attence-hrmmanage" data-bs-toggle="collapse" to="#">
                                    <span className="p-0 m-0">
                                        <img src={attendanceIcon} alt="Attendance Icon" />
                                    </span>
                                    <span className="sideBarTxt">Attendance</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                <ul id="attence-hrmmanage" className="nav-content collapse p-2" data-bs-parent="#sidebar-nav">
                                    {renderAttendanceSubMenu("attendenceDailyLog", "Daily Log", `/${whoIs}/attendance/daily-log`)}
                                    {renderAttendanceSubMenu("attendenceRequest", "Request", `/${whoIs}/attendance/request`)}
                                    {renderAttendanceSubMenu("attendenceDetails", "Details", `/${whoIs}/attendance/details`)}
                                    {renderAttendanceSubMenu("attendenceSummary", "Summary", `/${whoIs}/attendance/summary`)}
                                </ul>
                            </li>
                        </>
                    )}

                    {account === '1' && (
                        <>
                            {/* Leave section */}
                            <li className="nav-item">
                                <NavLink className="nav-link collapsed" data-bs-target="#leave-hrmmanage" data-bs-toggle="collapse" to="#">
                                    <span className="p-0 m-0">
                                        <img src={leaveIcon} alt="Leave Icon" />
                                    </span>
                                    <span className="sideBarTxt">Leave</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                <ul id="leave-hrmmanage" className="nav-content collapse p-2" data-bs-parent="#sidebar-nav">
                                    {renderLeaveSubMenu("leaveStatus", "Status", `/${whoIs}/leave/status`)}
                                    {renderLeaveSubMenu("leaveRequest", "Request", `/${whoIs}/leave/request`)}
                                    {renderLeaveSubMenu("leaveCalendar", "Calendar", `/${whoIs}/leave/calender`)}
                                    {renderLeaveSubMenu("leaveSummary", "Summary", `/${whoIs}/leave/summary`)}
                                </ul>
                            </li>

                            {/* Attendance section */}
                            <li className="nav-item">
                                <NavLink className="nav-link collapsed" data-bs-target="#attence-hrmmanage" data-bs-toggle="collapse" to="#">
                                    <span className="p-0 m-0">
                                        <img src={attendanceIcon} alt="Attendance Icon" />
                                    </span>
                                    <span className="sideBarTxt">Attendance</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                <ul id="attence-hrmmanage" className="nav-content collapse p-2" data-bs-parent="#sidebar-nav">
                                    {renderAttendanceSubMenu("attendenceDailyLog", "Daily Log", `/${whoIs}/attendance/daily-log`)}
                                    {renderAttendanceSubMenu("attendenceRequest", "Request", `/${whoIs}/attendance/request`)}
                                    {renderAttendanceSubMenu("attendenceDetails", "Details", `/${whoIs}/attendance/details`)}
                                    {renderAttendanceSubMenu("attendenceSummary", "Summary", `/${whoIs}/attendance/summary`)}
                                </ul>
                            </li>

                            {/* Administration section */}
                            <li className="nav-item">
                                <NavLink className="nav-link collapsed" data-bs-target="#administation-hrmmanage" data-bs-toggle="collapse" to="#">
                                    <span className="p-0 m-0">
                                        <img src={adminIcon} alt="Admin Icon" />
                                    </span>
                                    <span className="sideBarTxt">Administration</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                <ul id="administation-hrmmanage" className="nav-content collapse p-2" data-bs-parent="#sidebar-nav">
                                    {renderAdminSubMenu("adminRole", "Role", "/administation-list")}
                                    {renderAdminSubMenu("adminDepartment", "Department", "/administation-list")}
                                    {renderAdminSubMenu("adminHoliday", "Holiday", "/administation-list")}
                                    {renderAdminSubMenu("adminAnnouncement", "Announcement", "/administation-list")}
                                </ul>
                            </li>

                            {/* Settings section */}
                            <li className="nav-item">
                                <NavLink className="nav-link collapsed" data-bs-target="#Settings-hrmmanage" data-bs-toggle="collapse" to="#">
                                    <span className="p-0 m-0">
                                        <img src={settingsIcon} alt="Settings Icon" />
                                    </span>
                                    <span className="sideBarTxt">Settings</span>
                                    <span className="KeyboardArrowDownSharpIcon">
                                        <KeyboardArrowDownSharpIcon />
                                    </span>
                                </NavLink>
                                <ul id="Settings-hrmmanage" className="nav-content collapse p-2" data-bs-parent="#sidebar-nav">
                                    {renderSettingsSubMenu("settingsGeneral", "General", `/${whoIs}/settings`)}
                                    {renderSettingsSubMenu("settingsLeave", "Leave", "/Settings-list")}
                                </ul>
                            </li>
                        </>
                    )}
                </ul>
                <div class="logOutBtnParent p-3" onClick={handleLogout}>
                    <button class="w-100 log_out">Logout</button>
                </div>
            </div>
        </div>

    );
};

export default Sidebar;