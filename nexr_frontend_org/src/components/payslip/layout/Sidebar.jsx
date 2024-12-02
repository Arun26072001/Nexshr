import React, { useContext, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import './sidebar.css';
import KeyboardArrowDownSharpIcon from '@mui/icons-material/KeyboardArrowDownSharp';
import settingsIcon from '../../../asserts/settingsIcon.svg';
import jobDeskIcon from '../../../asserts/jobDeskIcon.svg';
import userIcon from '../../../asserts/userIcon.svg';
import leaveIcon from '../../../asserts/leaveIcon.svg';
import attendanceIcon from '../../../asserts/attendanceIcon.svg';
import adminIcon from '../../../asserts/adminIcon.svg';
import homeIcon from '../../../asserts/homeIcon.svg';
import { TimerStates } from '../HRMDashboard';
import { EssentialValues } from '../../../App';
import Cookies from "universal-cookie";
import { jwtDecode } from "jwt-decode";

const Sidebar = () => {
  const cookies = new Cookies();
  // const { roleData } = jwtDecode(cookies.get("token"));
  
  const { Dashboard, JobDesk, Employee,
    Leave, Attendance, Administration,
    Settings } = "";
  const { whoIs } = useContext(TimerStates);
  
  const { handleLogout, data } = useContext(EssentialValues);
  const param = useParams();
  const [activeSubmenu, setActiveSubmenu] = useState(param['*']);
  const [activeNavLink, setActiveNavLink] = useState();
  const [isOpen, setIsOpen] = useState(true);

  const toggleActiveLink = (name) => {
    setActiveNavLink(activeNavLink === name ? '' : name);
  };

  const handleActiveMenu = (nav) => {
    setActiveNavLink(nav);
    setActiveSubmenu('');
  };

  const renderNavLink = (condition, path, icon, text, key) => {
    return (
      condition && (
        <li
          key={key}
          className={`nav-item ${activeNavLink === key ? 'active' : ''}`}
          onClick={() => handleActiveMenu(key)}
        >
          <NavLink className="nav-link" to={path}>
            <span>
              <img src={icon} alt={`${text} Icon`} />
            </span>
            <span className="sideBarTxt">{text}</span>
          </NavLink>
        </li>
      )
    );
  };

  const renderSubMenu = (menuKey, submenuItems, icon, label) => {
    return (
      <li className="nav-item">
        <NavLink
          className={`nav-link ${activeNavLink === menuKey ? 'active' : ''}`}
          onClick={() => toggleActiveLink(menuKey)}
        >
          <span>
            <img src={icon} alt={`${label} Icon`} />
          </span>
          <span className="sideBarTxt">{label}</span>
          <span className="KeyboardArrowDownSharpIcon">
            <KeyboardArrowDownSharpIcon />
          </span>
        </NavLink>
        {activeNavLink === menuKey && (
          <ul className="nav-content p-2">
            {submenuItems.map((item) => (
              <li
                key={item.key}
                className={`submenu_navlist ${activeSubmenu === item.key ? 'active' : ''}`}
                onClick={() => setActiveSubmenu(item.key)}
              >
                <NavLink to={item.path} className="nav-lists">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div style={{ width: isOpen ? '250px' : '50px' }} className="sidebar sidebar_hrm">
      <ul className="sidebar-nav p-0" id="sidebar-nav">
        {renderNavLink(
          Dashboard === 'allow' || ['admin', 'hr', 'employee'].includes(whoIs),
          `/${data.orgId}/${whoIs}`,
          homeIcon,
          'Dashboard',
          'dashboard'
        )}

        {renderNavLink(
          JobDesk === 'allow' || ['admin', 'hr', 'employee'].includes(whoIs),
          `/${data.orgId}/${whoIs}/job-desk/attendance`,
          jobDeskIcon,
          'Job Desk',
          'jobDesk'
        )}

        {renderNavLink(
          Employee === 'allow' || ['admin', 'hr', 'employee'].includes(whoIs),
          `/${data.orgId}/${whoIs}/employee`,
          userIcon,
          'Employee',
          'employee'
        )}

        {(Leave === 'allow' || ['admin', 'hr'].includes(whoIs)) &&
          renderSubMenu(
            'leave',
            [
              { key: 'status', path: `/${data.orgId}/${whoIs}/leave/status`, label: 'Status' },
              { key: 'leave-request', path: `/${data.orgId}/${whoIs}/leave/leave-request`, label: 'Leave Request' },
              { key: 'calendar', path: `/${data.orgId}/${whoIs}/leave/calendar`, label: 'Calendar' },
              { key: 'leave-summary', path: `/${data.orgId}/${whoIs}/leave/leave-summary`, label: 'Leave Summary' }
            ],
            leaveIcon,
            'Leave'
          )}

        {(Attendance === 'allow' || ['admin', 'hr'].includes(whoIs)) &&
          renderSubMenu(
            'attendance',
            [
              { key: 'daily-log', path: `/${data.orgId}/${whoIs}/attendance/daily-log`, label: 'Daily Log' },
              { key: 'attendance-request', path: `/${data.orgId}/${whoIs}/attendance/attendance-request`, label: 'Attendance Request' },
              { key: 'details', path: `/${data.orgId}/${whoIs}/attendance/details`, label: 'Details' },
              { key: 'attendance-summary', path: `/${data.orgId}/${whoIs}/attendance/attendance-summary`, label: 'Attendance Summary' }
            ],
            attendanceIcon,
            'Attendance'
          )}

        {(Administration === 'allow' || whoIs === 'admin') &&
          renderSubMenu(
            'administration',
            [
              { key: 'role', path: `/${data.orgId}/${whoIs}/administration/role`, label: 'Role' },
              { key: 'shift', path: `/${data.orgId}/${whoIs}/administration/shift`, label: 'Shift' },
              { key: 'department', path: `/${data.orgId}/${whoIs}/administration/department`, label: 'Department' },
              { key: 'position', path: `/${data.orgId}/${whoIs}/administration/position`, label: 'Position' },
              { key: 'holiday', path: `/${data.orgId}/${whoIs}/administration/holiday`, label: 'Holiday' },
              { key: 'announcement', path: `/${data.orgId}/${whoIs}/administration/announcement`, label: 'Announcement' }
            ],
            adminIcon,
            'Administration'
          )}

        {(Settings === 'allow' || whoIs === 'admin') &&
          renderSubMenu(
            'settings',
            [
              { key: 'genderal', path: `/${data.orgId}/${whoIs}/settings/`, label: 'Genderal' },
              { key: 'account', path: `/${data.orgId}/${whoIs}/settings/account`, label: 'Account' },
              { key: 'payroll', path: `/${data.orgId}/${whoIs}/settings/payroll`, label: 'Payroll' }
            ],
            settingsIcon,
            'Settings'
          )}
      </ul>
      <div className="logOutBtnParent p-3" onClick={handleLogout}>
        <button className="w-100 log_out">Logout</button>
      </div>
    </div>
  );
};

export default Sidebar;
