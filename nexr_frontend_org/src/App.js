import React, { useState, createContext, useEffect } from "react";
import axios from "axios";
import Login from "./components/Login.jsx";
import HRMDashboard from "./components/payslip/HRMDashboard.jsx";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NoInternet from "./components/NoInternet.jsx";
import { jwtDecode } from "jwt-decode";
import "./App.css";
import 'rsuite/dist/rsuite.min.css';
import "react-datepicker/dist/react-datepicker.css";
import io from "socket.io-client";
import { Notification, toaster } from "rsuite";
import companyLogo from "./imgs/webnexs_logo.webp";
import AdminDashboard from "./components/superAdmin/AdminDashboard.js";
import { triggerToaster } from "./components/ReuseableAPI.jsx";

export const EssentialValues = createContext(null);

const App = () => {
  const url = process.env.REACT_APP_API_URL;
  // State Variables
  // const socket = io(`${url}`, { autoConnect: false });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);
  const [whoIs, setWhoIs] = useState("");
  const [isStartLogin, setIsStartLogin] = useState([null, "false"].includes(localStorage.getItem("isStartLogin")) ? false : true);
  const [isStartActivity, setIsStartActivity] = useState([null, "false"].includes(localStorage.getItem("isStartActivity")) ? false : true);
  const [data, setData] = useState({
    _id: null,
    Account: null,
    Name: null,
    token: null,
    annualLeave: null,
  });
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(true);
  const [isLogin, setIsLogin] = useState(localStorage.getItem("isLogin") === "true");
  const navigate = useNavigate();
  const location = useLocation();
  const [isChangeAnnouncements, setIschangeAnnouncements] = useState(false);

  function handleUpdateAnnouncements() {
    setIschangeAnnouncements(!isChangeAnnouncements)
  }
  // Helper Functions
  const handleLogout = () => {
    if (isStartLogin || isStartActivity) {
      toast.warn("You can't logout until the timer stops.");
      return;
    } else if (localStorage.getItem("isAddReasonForLate") === "false") {
      toast.warn("We won't allow you to logout without a reason for being late.");
      return;
    }

    localStorage.clear();
    setData({ _id: "", Account: "", Name: "", token: "", annualLeave: 0, profile: "" });
    setWhoIs("");

    setIsLogin(false);
    navigate("/login");
  };

  const replaceMiddleSegment = () => {
    navigate(location.pathname, { replace: true });
  };

  async function sendEmpIdtoExtension(empId, token) {
    window.postMessage({ type: "FROM_REACT", payload: { empId, token } }, "*");
  }

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/login`, { Email: email, Password: password });
      const decodedData = jwtDecode(response.data);

      if (!decodedData?.Account || !["17", "1", "2", "3", "4", "5"].includes(String(decodedData?.Account))) {
        throw new Error("Invalid account type.");
      }

      const accountType = decodedData?.Account;
      setData({
        _id: decodedData._id,
        Account: String(accountType),
        Name: `${decodedData.FirstName} ${decodedData.LastName}`,
        token: response.data,
        annualLeave: decodedData.annualLeaveEntitlement || 0,
        profile: decodedData.profile
      });

      // Update local storage
      localStorage.setItem("isLogin", true);
      localStorage.setItem("_id", decodedData._id);
      localStorage.setItem("token", response.data);

      setPass(true);
      setLoading(false);
      setIsLogin(true);
      // send emp id for extension
      sendEmpIdtoExtension(decodedData._id, response.data);
      const roles = { "17": "superAdmin", "1": "admin", "2": "hr", "3": "emp", "4": "manager", "5": "sys-admin" };
      setWhoIs(roles[String(accountType)] || "");
      navigate(`/${roles[String(accountType)]}`);
    } catch (error) {
      console.log(error);

      setPass(false);
      setLoading(false);
      if (error?.response?.data?.details?.includes("buffering timed out after 10000ms")) {
        navigate("/no-internet-connection");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setPass(true);
    login(event.target[0].value, event.target[1].value);
    event.target.reset();
  };

  // useEffect(() => {
  //   if (!socket.connected && isLogin) {
  //     socket.connect();
  //   }

  //   if (isLogin && data?._id) {
  //     socket.emit("join_room", data._id);

  //     const handlers = {
  //       receive_announcement: (response) => {
  //         console.log("responseData", response);
  //         triggerToaster(response);
  //         handleUpdateAnnouncements();
  //       },
  //       send_leave_notification: (response) => {
  //         console.log(response);
  //         triggerToaster(response);
  //         handleUpdateAnnouncements();
  //       },
  //       send_project_notification: (response) => {
  //         triggerToaster(response);
  //         handleUpdateAnnouncements();
  //       },
  //       send_task_notification: (response) => {
  //         triggerToaster(response);
  //         handleUpdateAnnouncements();
  //       },
  //       send_team_notification: (response) => {
  //         triggerToaster(response);
  //         handleUpdateAnnouncements();
  //       },
  //       send_wfh_notification: (response) => {
  //         console.log(response);
  //         triggerToaster(response);
  //         handleUpdateAnnouncements();
  //       },
  //     };

  //     // Attach all handlers
  //     Object.entries(handlers).forEach(([event, handler]) => {
  //       socket.on(event, handler);
  //     });

  //     return () => {
  //       // Detach all handlers
  //       Object.keys(handlers).forEach((event) => {
  //         socket.off(event);
  //       });
  //     };
  //   }
  // }, [socket, isLogin, data?._id]);

  useEffect(() => {
    localStorage.setItem("isStartLogin", isStartLogin);
    localStorage.setItem("isStartActivity", isStartActivity);
  }, []);

  useEffect(() => {
    if (!isStartLogin && isLogin) {
      toaster.push(
        <Notification
          header={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={companyLogo} alt="Company Logo" style={{ width: 50, height: 50, marginRight: 10 }} />
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Webnexs</span>
            </div>
          }
          closable
        >
          <strong className="text-danger">Important notice</strong>
          <p className="my-2"> The timer will stop when you close the tab or browser.</p>
        </Notification>,
        { placement: 'topCenter' }
      );
    }
  }, [])

  useEffect(() => {
    function fetchEssentialData() {
      const decodedData = jwtDecode(localStorage.getItem("token"));
      setData((prev) => ({
        ...prev,
        _id: decodedData._id || "",
        Account: decodedData?.Account || "",
        Name: `${decodedData.FirstName} ${decodedData.LastName}` || "",
        annualLeave: decodedData.annualLeaveEntitment || 0,
        token: localStorage.getItem("token") || "",
        profile: decodedData.profile
      }))
      const roles = { "17": "superAdmin", "1": "admin", "2": "hr", "3": "emp", "4": "manager", "5": "sys-admin" };
      setWhoIs(roles[String(decodedData?.Account)] || "");

      if (window.location.pathname !== "/login" || window.location.pathname !== `/${whoIs}`) {
        if (roles[String(decodedData?.Account)]) {
          replaceMiddleSegment()
        }
      }
    }
    if (localStorage.getItem("token")) {
      fetchEssentialData()
    }
  }, []);


  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(true);
      setTimeout(() => {
        setShowOfflineAlert(false);
      }, 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };


    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  // Check actual internet access
  const checkInternetAccess = async () => {
    try {
      const response = await fetch("https://www.google.com", { mode: "no-cors" });
      setHasInternet(true);
    } catch (error) {
      setHasInternet(false);
    }
  };

  useEffect(() => {
    if (!isOnline && showOfflineAlert) {
      navigate("/no-internet-connection")
    } else if (isOnline && !showOfflineAlert && location.pathname === "/no-internet-connection") {
      checkInternetAccess();
      navigate(`/${whoIs}`)
    }
  }, [isLogin, showOfflineAlert, hasInternet])

  // Component Rendering
  return (
    <EssentialValues.Provider
      value={{
        data,
        setData,
        handleLogout,
        handleSubmit,
        loading,
        pass,
        isLogin,
        isStartLogin,
        setIsStartLogin,
        isStartActivity,
        whoIs,
        setIsStartActivity,
        // socket,
        handleUpdateAnnouncements,
        isChangeAnnouncements
      }}
    >
      <ToastContainer />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="/" element={isLogin && whoIs && data.token ? <Navigate to={`/${whoIs}`} /> : <Navigate to="/login" />} />
        <Route
          path={`${whoIs}/*`}
          element={isLogin && whoIs && data.token ? whoIs === "superAdmin" ? <AdminDashboard /> : <HRMDashboard /> : <Navigate to="/login" />}
        />
        <Route path="no-internet-connection" element={<NoInternet />} />
        <Route path="*" element=
          {<div className='d-flex align-items-center justify-content-center' style={{ height: "100vh" }}>
            <h1 >404</h1>
          </div>} />
      </Routes>
    </EssentialValues.Provider>
  );
};

export default App;
