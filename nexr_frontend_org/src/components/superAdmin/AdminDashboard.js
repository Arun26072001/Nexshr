import React, { useContext, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import settingsIcon from '../../asserts/settingsIcon.svg';
import homeIcon from '../../asserts/homeIcon.svg';
import userIcon from '../../asserts/userIcon.svg';
import orgIcon from "../../asserts/ORGANISATion.svg";
import ArrowCircleRightRoundedIcon from '@mui/icons-material/ArrowCircleRightRounded';
import AdmiMain from './AdmiMain';
import AdminOrganizations from './AdminOrganizations';
import AdminSettings from './AdminOrgSettings';
import axios from 'axios';
import ViewOrganization from './ViewOrganization';
import AdminOrgMembers from './AdminOrgMembers';
import AdminOrgSettings from './AdminOrgSettings';
import AdminUsers from './AdminUsers';
import "./Admin.css";
import { EssentialValues } from '../../App';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { whoIs, handleLogout } = useContext(EssentialValues);
    const token = localStorage.getItem('token');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [organizations, setOrganizations] = useState([])
    const [users, setUsers] = useState([])
    const url = process.env.REACT_APP_API_URL;
    const [isLoading, setIsLoading] = useState(false);
    const [ischangedOrgs, setIsChangedOrgs] = useState(false);
    const params = useParams();
    const [activeNavLink, setActiveNavLink] = useState(params["*"]);

    function handleChangeToRefetchOrgs() {
        setIsChangedOrgs(!ischangedOrgs)
    }

    const fetchAllOrganizations = async () => {
        setIsLoading(true)
        try {
            const response = await axios(`${url}api/organization`, {
                headers: {
                    Authorization: token
                }
            })
            setOrganizations(response.data)

       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error("Error fetching organizations:", error);
        }
        setIsLoading(false);
    }

    async function fetchEmps() {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}api/user-account`, {
                headers: {
                    Authorization: token || ""
                }
            });
            setUsers(res.data)
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchAllOrganizations()
    }, [ischangedOrgs])

    useEffect(() => {
        fetchEmps()
    }, [])

    if (!token) {
        return (
            <div className="text-center mt-5">
                Access Denied. Please
                <Link to="/login"> log in.</Link>
            </div>
        );
    }
    return (
        <div className="admin-dashboard-container">
            {/* navbar */}
            <nav className="admin-navbar">
                <Link className="text-decoration-none text-dark">
                    <div className="d-flex">
                        <img
                            src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public"
                            className="text-light mb-1 me-1"
                            width="32px"
                            height="32px"
                            alt=""
                        />
                        <h4 className="cursor-pointer">Nexshr</h4>
                    </div>
                </Link>

                <div className="dropdown">
                    <Link
                        className="dropdown-toggle text-decoration-none text-dark"
                        type="button"
                        id="dropdownMenuButton1"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        Super Admin
                    </Link>
                    <ul className="dropdown-menu admin-dropdown" aria-labelledby="dropdownMenuButton1">
                        <li>
                            <Link className="dropdown-item" onClick={handleLogout}>
                                Logout
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="d-flex main-content-container w-100">
                {/* Sidebar */}
                <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} text-light p-3`}>
                    <button
                        className="backBtn mb-3"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        <ArrowCircleRightRoundedIcon
                            style={{
                                transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                                border: "1px solid",
                                borderRadius: "15px"
                            }}
                        />
                    </button>
                    <nav className="nav flex-column">
                        <Link className={`nav-link text-dark ${activeNavLink === "" ? "activeLink" : ""}`} to={`/${whoIs}`} onClick={() => setActiveNavLink("")}>
                            <img src={homeIcon} width={22} height={22} className="m-1" />
                            {!isSidebarCollapsed && "Dashboard"}
                        </Link>
                        <Link className={`nav-link text-dark ${activeNavLink === "organizations" ? "activeLink" : ""}`} onClick={() => setActiveNavLink("organizations")} to={`/${whoIs}/organizations`}>
                            <img src={orgIcon} width={22} height={22} className="m-1" />
                            {!isSidebarCollapsed && "Organizations"}
                        </Link>
                        <Link className={`nav-link text-dark ${activeNavLink === "users" ? "activeLink" : ""}`} onClick={() => setActiveNavLink("users")} to={`/${whoIs}/users`}>
                            <img src={userIcon} width={22} height={22} className="m-1" />
                            {!isSidebarCollapsed && "Users"}
                        </Link>
                        <Link className={`nav-link text-dark ${activeNavLink === "settings" ? "activeLink" : ""}`} onClick={() => setActiveNavLink("settings")} to={`/${whoIs}/settings`}>
                            <img src={settingsIcon} width={22} height={22} className="m-1" />
                            {!isSidebarCollapsed && "Settings"}
                        </Link>
                    </nav>
                </aside>
                <div className={`${isSidebarCollapsed ? "in-active" : "active"} right-side ms-auto`}>
                    <Routes>
                        <Route path="/" element={<AdmiMain organizations={organizations} users={users} isLoading={isLoading}  />} />
                        <Route path="organizations" element={<AdminOrganizations organizations={organizations} isLoading={isLoading} handleChangeToRefetchOrgs={handleChangeToRefetchOrgs} />} />
                        <Route path="organizations/:organizationId" element={<ViewOrganization organizations={organizations} isLoading={isLoading} handleChangeToRefetchOrgs={handleChangeToRefetchOrgs} />} />
                        <Route path="organizations/:organizationId/members" element={<AdminOrgMembers organizations={organizations} isLoading={isLoading} />} />
                        <Route path="organizations/:organizationId/settings" element={<AdminOrgSettings organizations={organizations} isLoading={isLoading} />} />
                        <Route path="users" element={<AdminUsers users={users} isLoading={isLoading} />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="*" element={<h1 className='text-center'>404</h1>} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
