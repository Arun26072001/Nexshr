import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import './sidebar.css';
import KeyboardArrowDownSharpIcon from '@mui/icons-material/KeyboardArrowDownSharp';
import { EssentialValues } from '../../../App';
import { jwtDecode } from 'jwt-decode';
// icons
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import jobDeskIcon from '../../../asserts/jobDeskIcon.svg';
import settingsIcon from '../../../asserts/settingsIcon.svg';
import homeIcon from '../../../asserts/homeIcon.svg';
import userIcon from '../../../asserts/userIcon.svg';
import leaveIcon from '../../../asserts/leaveIcon.svg';
import attendanceIcon from '../../../asserts/attendanceIcon.svg';
import adminIcon from '../../../asserts/adminIcon.svg';
import fileIcon from "../../../asserts/file.svg";
import folderIcon from "../../../asserts/folder.svg";
import taskIcon from "../../../asserts/task.svg";
import workFromHomeIcon from "../../../asserts/workfromhome.svg";
import emailTempIcon from "../../../asserts/env.svg";
import holidayIcon from "../../../asserts/beach.svg";
import announcementIcon from "../../../asserts/announcement.svg";
import bugIcon from "../../../asserts/bugIcon.svg";

const Sidebar = ({ isMobileView, handleSideBar, setIsMobileView }) => {
  const { data, whoIs } = useContext(EssentialValues);
  const { token, _id } = data;
  const decodedData = jwtDecode(token);
  const { isTeamManager } = decodedData;
  const navigate = useNavigate();

  const { Dashboard, JobDesk, Employee, Leave,
    Attendance, Administration, Settings, WorkFromHome,
    Holiday, EmailTemplate, Task, Project, Report, Announcement } = decodedData?.roleData?.pageAuth;
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
    // console.log(condition, path, icon, text, key);
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
          onClick={() => {
            toggleActiveLink(menuKey)
            setIsMobileView(false)
          }}
        >
          <span>
            <img src={icon} width={"22"} height={"22"} alt={`${label} Icon`} />
          </span>
          <span className="sideBarTxt">{label}</span>
          {!isMobileView ? <span className={`KeyboardArrowDownSharpIcon ${activeNavLink === menuKey ? "rotate" : ""}`}>
            <KeyboardArrowDownSharpIcon />
          </span> : null}
        </NavLink>
        {activeNavLink === menuKey && (
          <ul className="nav-content p-2">
            {submenuItems.map((item) => {
              return (
                <li
                  key={item.key}
                  className={`submenu_navlist ${activeSubmenu === item.key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSubmenu(item.key)
                    navigate(item.path)
                  }}
                >
                  <NavLink className="nav-lists">
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
    <div style={{ width: isMobileView ? "40px" : "250px" }} className={`sidebar sidebar_hrm`}>
      <div className="d-flex position-relative w-100 justify-content-center align-items-center">
        <span className={`circleArrowIcon ${isMobileView ? "rotate" : ""}`} onClick={handleSideBar} style={{ position: 'sticky', top: "0px", display: "flex !important", right: "0px", background: "white", border: "none", boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px" }}>
          <ChevronRightRoundedIcon color='dark' />
        </span>
      </div>
      <ul className="sidebar-nav p-0" id="sidebar-nav">
        {renderNavLink(
          Dashboard === 'allow' || ['admin', 'hr', 'emp'].includes(whoIs),
          `/${whoIs}`,
          homeIcon,
          'Dashboard',
          'dashboard'
        )}

        {renderNavLink(
          JobDesk === 'allow' ,
          `/${whoIs}/job-desk/my-details`,
          jobDeskIcon,
          'Job Desk',
          'jobDesk'
        )}

        {(Employee === 'allow' && [decodedData?.isTeamHead, decodedData?.isTeamLead, isTeamManager].includes(true)) &&
          renderSubMenu(
            "employee",
            [
              { key: `my-details`, path: `/${whoIs}/employee/edit/${_id}`, label: 'My Details' },
              { key: 'my-team', path: `/${whoIs}/employee`, label: 'My Teams' }
            ],
            userIcon,
            'Associate'
          )}

        {![decodedData?.isTeamHead, decodedData?.isTeamLead, isTeamManager].includes(true) &&
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
          Project === "allow",
          `/${whoIs}/projects`,
          folderIcon,
          'Project',
          'projects'
        )}

        {renderNavLink(
          Task === "allow",
          `/${whoIs}/tasks`,
          taskIcon,
          'Tasks',
          'tasks'
        )}

        {renderNavLink(
          Report === "allow",
          `/${whoIs}/reports`,
          fileIcon,
          'Reports',
          'reports'
        )}

        {/* Email template */}
        {renderNavLink(
          EmailTemplate === "allow",
          `/${whoIs}/email-templates`,
          emailTempIcon,
          'Email-Template',
          'email-template'
        )}

        {/* Announcements */}
        {renderNavLink(
          Announcement === "allow",
          `/${whoIs}/announcement`,
          announcementIcon,
          'Announcement',
          'announcement'
        )}

        {/* holiday */}
        {renderNavLink(
          Holiday === "allow",
          `/${whoIs}/holiday`,
          holidayIcon,
          'Holiday',
          'holiday'
        )}

        {Leave === 'allow' && ["admin", "sys-admin", "hr"].includes(whoIs) &&
          renderSubMenu(
            'leave',
            [
              // { key: 'status', path: `/${whoIs}/leave/status`, label: 'Status' },
              // { key: 'leave-request', path: `/${whoIs}/leave/leave-request`, label: 'Leave Request' },
              // { key: 'leave-summary', path: `/${whoIs}/leave/leave-summary`, label: 'Leave Summary' },
              { key: 'leave-records', path: `/${whoIs}/leave/leave-records`, label: 'Leave Records' },
              { key: 'calendar', path: `/${whoIs}/leave/calendar`, label: 'Calendar' },
              { key: 'leave-details', path: `/${whoIs}/leave/leave-details`, label: 'Leave Details' },
            ],
            leaveIcon,
            'Leave'
          )}

        {(
          (['emp'].includes(whoIs) && [decodedData?.isTeamHead, decodedData?.isTeamLead].includes(true)) ||
          (whoIs === "manager" && isTeamManager)
        ) &&
          renderSubMenu(
            'leave',
            [
              { key: 'leave-records', path: `/${whoIs}/leave/leave-records`, label: 'Leave Records' },
            ],
            leaveIcon,
            'Leave'
          )}

        {(
          (whoIs === "emp" && [decodedData?.isTeamHead, decodedData?.isTeamLead].includes(true)) ||
          (whoIs === "manager" && isTeamManager)
        ) &&
          renderSubMenu(
            'attendance',
            [
              { key: 'daily-log', path: `/${whoIs}/attendance/daily-log`, label: 'Daily Log' }
            ],
            attendanceIcon,
            'Attendance'
          )}

        {Attendance === 'allow' && 
          renderSubMenu(
            'attendance',
            [
              { key: 'daily-log', path: `/${whoIs}/attendance/daily-log`, label: 'Daily Log' },
              { key: 'attendance-request', path: `/${whoIs}/attendance/attendance-request`, label: 'Attendance Request' },
              { key: 'details', path: `/${whoIs}/attendance/details`, label: 'Details' },
              { key: 'late-punch', path: `/${whoIs}/attendance/late-punch`, label: 'Late Punch' },
              { key: 'attendance-summary', path: `/${whoIs}/attendance/attendance-summary`, label: 'Attendance Summary' }
            ],
            attendanceIcon,
            'Attendance'
          )}

        {(Administration === 'allow') &&
          renderSubMenu(
            'administration',
            [
              { key: 'role', path: `/${whoIs}/administration/role`, label: 'Role' },
              { key: 'company', path: `/${whoIs}/administration/company`, label: 'Company' },
              { key: 'country', path: `/${whoIs}/administration/country`, label: 'Country' },
              { key: 'department', path: `/${whoIs}/administration/department`, label: 'Department' },
              { key: 'position', path: `/${whoIs}/administration/position`, label: 'Position' },
              { key: 'team', path: `/${whoIs}/administration/team`, label: 'Team' }
            ],
            adminIcon,
            'Administration'
          )}

        {(Settings === 'allow') &&
          renderSubMenu(
            'settings',
            [
              { key: 'profile', path: `/${whoIs}/settings/profile`, label: 'Profile' },
              { key: 'payroll', path: `/${whoIs}/settings/payroll`, label: 'Payroll' }
            ],
            settingsIcon,
            'Settings'
          )}

        {
          WorkFromHome === 'allow' ?
            renderSubMenu(
              'workfromhome',
              [
                { key: 'wfh-request', path: `/${whoIs}/workfromhome/wfh-request`, label: 'WFH Requests' },
              ],
              workFromHomeIcon,
              'WorkFromHome'
            ) : null}

        {/* Bug sheet */}
        {renderNavLink(
          ['hr', "admin", "emp"].includes(whoIs),
          `/${whoIs}/raise-bugs`,
          bugIcon,
          'Raise Bugs',
          'raise-bugs'
        )}

      </ul>
    </div>
  );
};

export default Sidebar;
