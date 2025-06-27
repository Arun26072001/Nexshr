import React, { useState, createContext, useEffect } from "react";
import axios from "axios";
import Login from "./components/Login.jsx";
import HRMDashboard from "./components/payslip/HRMDashboard.jsx";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import { registerLicense } from '@syncfusion/ej2-base';
import "./App.css";
import 'rsuite/dist/rsuite.min.css';
import "react-datepicker/dist/react-datepicker.css";
import AdminDashboard from "./components/superAdmin/AdminDashboard.js";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase/firebase.js";
import { triggerToaster } from "./components/ReuseableAPI.jsx";
import ErrorUI from "./components/ErrorUI.jsx";

export const EssentialValues = createContext(null);
registerLicense("Ngo9BigBOggjHTQxAR8/V1NNaF1cWWhPYVF+WmFZfVtgd19DZVZVRWYuP1ZhSXxWdkBhUH9ddXFRQmhbU0V9XUs=")
const App = () => {
  const url = process.env.REACT_APP_API_URL;
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
  const [isChangeComments, setIsChangeComments] = useState("");
  const [isViewTakeTime, setIsTaketime] = useState(localStorage.getItem("isViewTakeTime") ? true : false);
  const [isViewEarlyLogout, setIsViewEarlyLogout] = useState(JSON.parse(localStorage.getItem("isViewEarlyLogout")) ? true : false);

  function handleUpdateAnnouncements() {
    setIschangeAnnouncements(!isChangeAnnouncements);
  }

  async function handleUpdateComments() {
    setIsChangeComments(!isChangeComments)
  }

  // change ask the reason late in breaks and lunch activity
  function changeViewReasonForTaketime() {
    if (!isViewTakeTime) {
      localStorage.setItem("isViewTakeTime", true)
    }
    setIsTaketime(!isViewTakeTime)
  }

  // change ask the reason for early logout
  function changeViewReasonForEarlyLogout() {
    if (!isViewEarlyLogout) {
      localStorage.setItem("isViewEarlyLogout", true)
    }
    setIsViewEarlyLogout(!isViewEarlyLogout)
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
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
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


  async function saveFcmToken(empId, fcmToken) {
    try {
      const res = await axios.post(`${url}/api/employee/add-fcm-token`, { empId, fcmToken }, {
        headers: {
          Authorization: data.token || ""
        }
      })
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in save fcm token", error);
    }
  }


  useEffect(() => {
    const requestPermission = async () => {
      try {
        // ask permission from employee
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const currentToken = await getToken(messaging, {
            vapidKey: "BLmSTq4TWV1Z7V2NgYclknMXlVrC35Ol4CwTBoykLkGH8ikvKOO4caS9XuWjqgI3rEm04mRrX2HfybEal6qUrVg",
          });
          if (currentToken) {
            // setFcmToken(currentToken);
            if (data?._id) {
              saveFcmToken(data._id, currentToken);
            }
          } else {
            console.log("No FCM token received.");
          }
        } else {
          console.log("Notification permission denied.");
        }
      } catch (error) {
        if (error?.message === "Network Error") {
          navigate("/network-issue")
        }
        console.error("Error getting permission for notifications", error);
      }
    };

    requestPermission();

    // Listen for incoming messages when the app is in the foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      const decodedData = jwtDecode(localStorage.getItem("token"));
      const type = payload?.data?.type;
      if (!["edit comment", "delete comment"].includes(type)) {
        triggerToaster({ company: decodedData.company, title: payload.data.title, message: payload.data.body })
      }
      if (type && type.toLowerCase().includes("comment")) {
        setIsChangeComments(payload?.messageId)
      }
      if (type === "late reason") {
        changeViewReasonForTaketime();
      } if (type === "early reason") {
        changeViewReasonForEarlyLogout()
      }
      setIschangeAnnouncements(payload.messageId);
    });

    return () => unsubscribe();
  }, [data._id]);

  useEffect(() => {
    localStorage.setItem("isStartLogin", isStartLogin);
    localStorage.setItem("isStartActivity", isStartActivity);
  }, []);

  useEffect(() => {
    function fetchEssentialData() {
      const decodedData = jwtDecode(localStorage.getItem("token"));
      setData((prev) => ({
        ...prev,
        _id: decodedData._id || "",
        Account: String(decodedData?.Account) || "",
        Name: `${decodedData.FirstName} ${decodedData.LastName}` || "",
        annualLeave: decodedData.annualLeaveEntitlement || 0,
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

  // detech browser is online or offline
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
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
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
        isViewTakeTime,
        changeViewReasonForEarlyLogout,
        isViewEarlyLogout,
        setIsStartActivity,
        changeViewReasonForTaketime,
        handleUpdateAnnouncements,
        isChangeComments,
        handleUpdateComments,
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
        <Route path="network-issue" element={<ErrorUI title={"Network Error"} description={"Please check your network and server connection!"} />} />
        <Route path="no-internet-connection" element={<ErrorUI title={"Network Disconnected"} description={"Please check your network connection!"} />} />
        <Route path="*" element=
          {<div className='d-flex align-items-center justify-content-center' style={{ height: "100vh" }}>
            <h1 >404</h1>
          </div>} />
      </Routes>
    </EssentialValues.Provider>
  );
};

export default App;
