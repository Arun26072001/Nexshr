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

const Sidebar = () => {
  const dashboard = localStorage.getItem('Dashboard');
  const jobDesk = localStorage.getItem('JobDesk');
  const employee = localStorage.getItem('Employee');
  const leave = localStorage.getItem('Leave');
  const attendance = localStorage.getItem('Attendance');
  const admin = localStorage.getItem('Administration');
  const settings = localStorage.getItem('Settings');

  const { whoIs } = useContext(TimerStates);
  const { handleLogout } = useContext(EssentialValues);
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
          dashboard === 'allow' || ['admin', 'hr', 'employee'].includes(whoIs),
          `/${whoIs}`,
          homeIcon,
          'Dashboard',
          'dashboard'
        )}

        {renderNavLink(
          jobDesk === 'allow' || ['admin', 'hr', 'employee'].includes(whoIs),
          `/${whoIs}/job-desk/attendance`,
          jobDeskIcon,
          'Job Desk',
          'jobDesk'
        )}

        {renderNavLink(
          employee === 'allow' || ['admin', 'hr', 'employee'].includes(whoIs),
          `/${whoIs}/employee`,
          userIcon,
          'Employee',
          'employee'
        )}

        {(leave === 'allow' || ['admin', 'hr'].includes(whoIs)) &&
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

        {(attendance === 'allow' || ['admin', 'hr'].includes(whoIs)) &&
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

        {(admin === 'allow' || whoIs === 'admin') &&
          renderSubMenu(
            'administration',
            [
              { key: 'role', path: `/${whoIs}/administration/role`, label: 'Role' },
              { key: 'shift', path: `/${whoIs}/administration/shift`, label: 'Shift' },
              { key: 'department', path: `/${whoIs}/administration/department`, label: 'Department' },
              { key: 'position', path: `/${whoIs}/administration/position`, label: 'Position' },
              { key: 'holiday', path: `/${whoIs}/administration/holiday`, label: 'Holiday' },
              { key: 'announcement', path: `/${whoIs}/administration/announcement`, label: 'Announcement' }
            ],
            adminIcon,
            'Administration'
          )}

        {(settings === 'allow' || whoIs === 'admin') &&
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
      <div className="logOutBtnParent p-3" onClick={handleLogout}>
        <button className="w-100 log_out">Logout</button>
      </div>
    </div>
  );
};

export default Sidebar;
