import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import './sidebar.css';
import KeyboardArrowDownSharpIcon from '@mui/icons-material/KeyboardArrowDownSharp';
import jobDeskIcon from '../../../asserts/jobDeskIcon.svg';
import settingsIcon from '../../../asserts/settingsIcon.svg';
import homeIcon from '../../../asserts/homeIcon.svg';
import userIcon from '../../../asserts/userIcon.svg';
import leaveIcon from '../../../asserts/leaveIcon.svg';
import attendanceIcon from '../../../asserts/attendanceIcon.svg';
import calendarIcon from "../../../asserts/calendar.svg";
import adminIcon from '../../../asserts/adminIcon.svg';
import fileIcon from "../../../asserts/file.svg";
import folderIcon from "../../../asserts/folder.svg";
import taskIcon from "../../../asserts/task.svg";
import { EssentialValues } from '../../../App';
import { jwtDecode } from 'jwt-decode';
import { TimerStates } from '../HRMDashboard';

const Sidebar = ({ sideBar }) => {
  const { data, whoIs } = useContext(EssentialValues);
  const { setIsEditEmp } = useContext(TimerStates);
  const { token, _id } = data;
  const decodedData = jwtDecode(token);

  const { isTeamLead, isTeamHead, isTeamManager } = decodedData;
  const { Dashboard, JobDesk, Employee, Leave,
    Attendance, Administration, Settings
  } = decodedData?.roleData?.pageAuth;
  console.log(decodedData?.roleData?.pageAuth);

  const param = useParams();

  const [activeSubmenu, setActiveSubmenu] = useState(param['*']);
  const [activeNavLink, setActiveNavLink] = useState(param['*'] === "" ? "dashboard" : param['*'].includes("my-details") ? "jobDesk" : param['*']);

  const toggleActiveLink = (name) => {
    setActiveNavLink(activeNavLink === name ? '' : name);
  };

  const handleActiveMenu = (nav) => {
    setActiveNavLink(nav);
    setActiveSubmenu('');
  };

  const renderNavLink = (condition, path, icon, text, key) => {
    if (path.includes("/employee/edit/")) {
      setIsEditEmp(true)
    }

    return (
      condition && (
        <li
          key={key}
          className={`nav-item ${activeNavLink === key ? 'active' : ''}`}
          onClick={() => handleActiveMenu(key)}
        >
          <NavLink className="nav-link" to={path}>
            <span>
              {
                <img src={icon} width={"22"} height={"22"} alt={`${text} Icon`} />
              }
            </span>
            <span className="sideBarTxt">{text}</span>
          </NavLink>
        </li>
      )
    )
  };
  const renderSubMenu = (menuKey, submenuItems, icon, label) => {
    return (
      <li className="nav-item">
        <NavLink
          className={`nav-link ${activeNavLink === menuKey ? 'active' : ''}`}
          onClick={() => toggleActiveLink(menuKey)}
        >
          <span>
            <img src={icon} width={"22"} height={"22"} alt={`${label} Icon`} />
          </span>
          <span className="sideBarTxt">{label}</span>
          <span className={`KeyboardArrowDownSharpIcon ${activeNavLink === menuKey ? "rotate" : ""}`}>
            <KeyboardArrowDownSharpIcon />
          </span>
        </NavLink>
        {activeNavLink === menuKey && (
          <ul className="nav-content p-2">
            {submenuItems.map((item) => {
              if (item.path.includes("/employee/edit/")) {
                setIsEditEmp(true)
              }
              return (
                <li
                  key={item.key}
                  className={`submenu_navlist ${activeSubmenu === item.key ? 'active' : ''}`}
                  onClick={() => setActiveSubmenu(item.key)}
                >
                  <NavLink to={item.path} className="nav-lists">
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div style={{ width: '250px' }} className={`${!sideBar ? "d-none" : ""} sidebar sidebar_hrm`}>
      <ul className="sidebar-nav p-0" id="sidebar-nav">
        {renderNavLink(
          Dashboard === 'allow' || ['admin', 'hr', 'emp'].includes(whoIs),
          `/${whoIs}`,
          homeIcon,
          'Dashboard',
          'dashboard'
        )}

        {renderNavLink(
          JobDesk === 'allow' || ['admin', 'hr', 'emp'].includes(whoIs),
          `/${whoIs}/job-desk/my-details`,
          jobDeskIcon,
          'Job Desk',
          'jobDesk'
        )}

        {(Employee === 'allow' && [isTeamHead, isTeamLead, isTeamManager].includes(true)) &&
          renderSubMenu(
            "employee",
            [
              { key: `my-details`, path: `/${whoIs}/employee/edit/${_id}`, label: 'My Details' },
              { key: 'my-team', path: `/${whoIs}/employee`, label: 'My Teams' }
            ],
            userIcon,
            'Associate'
          )}

        {![isTeamHead, isTeamLead, isTeamManager].includes(true) &&
          renderNavLink(
            (Employee === 'allow' || ['admin', 'hr', 'emp'].includes(whoIs)),
            (["emp", "sys-admin"].includes(whoIs)
              ? `/${whoIs}/employee/edit/${_id}`
              : `/${whoIs}/employee`),
            userIcon,
            'Associate',
            'employee'
          )}

        {renderNavLink(
          ['emp', "manager"].includes(whoIs),
          `/${whoIs}/projects`,
          folderIcon,
          'Project',
          'projects'
        )}

        {renderNavLink(
          ['emp', "manager"].includes(whoIs),
          `/${whoIs}/tasks`,
          taskIcon,
          'Tasks',
          'tasks'
        )}

        {renderNavLink(
          ['emp', "manager"].includes(whoIs),
          `/${whoIs}/reports`,
          fileIcon,
          'Reports',
          'reports'
        )}

        {renderNavLink(
          ['hr', "emp"].includes(whoIs),
          `/${whoIs}/calendar`,
          calendarIcon,
          'Calendar',
          'calendar'
        )}

        {Leave === 'allow' && ["admin", "sys-admin", "hr"].includes(whoIs) &&
          renderSubMenu(
            'leave',
            [
              { key: 'status', path: `/${whoIs}/leave/status`, label: 'Status' },
              { key: 'leave-request', path: `/${whoIs}/leave/leave-request`, label: 'Leave Request' },
              { key: 'calendar', path: `/${whoIs}/leave/calendar`, label: 'Calendar' },
              { key: 'leave-summary', path: `/${whoIs}/leave/leave-summary`, label: 'Leave Summary' }
            ],
            leaveIcon,
            'Leave'
          )}

        {(
          (decodedData.isTeamLead && whoIs === "emp") ||
          (decodedData.isTeamHead && whoIs === "emp") ||
          (decodedData.isTeamManager && whoIs === "manager"))
          &&
          renderSubMenu(
            'leave',
            [
              { key: 'leave-request', path: `/${whoIs}/leave/leave-request`, label: 'Leave Request' },
            ],
            leaveIcon,
            'Leave'
          )}

        {((decodedData.isTeamLead && whoIs === "emp") ||
          (decodedData.isTeamHead && whoIs === "emp") ||
          (decodedData.isTeamManager && whoIs === "manager"))
          &&
          renderSubMenu(
            'attendance',
            [
              { key: 'daily-log', path: `/${whoIs}/attendance/daily-log`, label: 'Daily Log' }
            ],
            attendanceIcon,
            'Attendance'
          )}

        {Attendance === 'allow' && ["admin", "sys-admin", "hr"].includes(whoIs) &&
          renderSubMenu(
            'attendance',
            [
              { key: 'daily-log', path: `/${whoIs}/attendance/daily-log`, label: 'Daily Log' },
              { key: 'attendance-request', path: `/${whoIs}/attendance/attendance-request`, label: 'Attendance Request' },
              { key: 'details', path: `/${whoIs}/attendance/details`, label: 'Details' },
              { key: 'attendance-summary', path: `/${whoIs}/attendance/attendance-summary`, label: 'Attendance Summary' }
            ],
            attendanceIcon,
            'Attendance'
          )}

        {(Administration === 'allow' || whoIs === 'admin') &&
          renderSubMenu(
            'administration',
            [
              { key: 'role', path: `/${whoIs}/administration/role`, label: 'Role' },
              { key: 'company', path: `/${whoIs}/administration/company`, label: 'Company' },
              { key: 'country', path: `/${whoIs}/administration/country`, label: 'Country' },
              { key: 'department', path: `/${whoIs}/administration/department`, label: 'Department' },
              { key: 'position', path: `/${whoIs}/administration/position`, label: 'Position' },
              { key: 'holiday', path: `/${whoIs}/administration/holiday`, label: 'Holiday' },
              { key: 'announcement', path: `/${whoIs}/administration/announcement`, label: 'Announcement' },
              { key: 'team', path: `/${whoIs}/administration/team`, label: 'Team' },
              { key: 'leave-details', path: `/${whoIs}/administration/leave-details`, label: 'Leave Details' },
            ],
            adminIcon,
            'Administration'
          )}

        {(Settings === 'allow' || whoIs === 'admin') &&
          renderSubMenu(
            'settings',
            [
              { key: 'profile', path: `/${whoIs}/settings/profile`, label: 'Profile' },
              { key: 'account', path: `/${whoIs}/settings/account`, label: 'Account' },
              { key: 'payroll', path: `/${whoIs}/settings/payroll`, label: 'Payroll' }
            ],
            settingsIcon,
            'Settings'
          )}
      </ul>
      {/* <div className="logOutBtnParent p-3" onClick={handleLogout}>
        <button className="w-100 log_out">Logout</button>
      </div> */}
    </div>
  );
};

export default Sidebar;
