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

export const EssentialValues = createContext(null);

const App = () => {
  const url = process.env.REACT_APP_API_URL;
  // State Variables
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [whoIs, setWhoIs] = useState("");
  const [isStartLogin, setIsStartLogin] = useState(localStorage.getItem("isStartLogin") === "true");
  const [isStartActivity, setIsStartActivity] = useState(localStorage.getItem("isStartActivity") === "true");
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

  // Helper Functions
  const handleLogout = () => {
    console.log(isStartLogin, isStartActivity);

    if (isStartLogin || isStartActivity) {
      toast.warn("You can't logout until the timer stops.");
      return;
    } else if (localStorage.getItem("isAddReasonForLate") === "false") {
      toast.warn("We won't allow you to logout without a reason for being late.");
      return;
    }

    localStorage.clear();
    setData({ _id: "", Account: "", Name: "", token: "", annualLeave: 0 });
    setWhoIs("");

    setIsLogin(false);
    navigate("/login");
  };

  const replaceMiddleSegment = () => {
    navigate(location.pathname, { replace: true });
  };

  async function sendEmpIdtoExtension(empId, token) {
    window.postMessage({ type: "FROM_REACT", payload: { empId, token } }, "*");
    console.log("send message");
  }

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/login`, { Email: email, Password: password });
      const decodedData = jwtDecode(response.data);

      if (!decodedData.Account || !["1", "2", "3", "4", "5"].includes(String(decodedData.Account))) {
        throw new Error("Invalid account type.");
      }

      const accountType = decodedData.Account;
      setData({
        _id: decodedData._id,
        Account: String(accountType),
        Name: `${decodedData.FirstName} ${decodedData.LastName}`,
        token: response.data,
        annualLeave: decodedData.annualLeaveEntitlement || 0,
      });

      // Update local storage
      localStorage.setItem("isLogin", true);
      localStorage.setItem("Account", accountType);
      localStorage.setItem("_id", decodedData._id);
      localStorage.setItem("Name", `${decodedData.FirstName} ${decodedData.LastName}`);
      localStorage.setItem("annualLeaveEntitment", decodedData.annualLeaveEntitlement || 0);
      localStorage.setItem("token", response.data);

      setPass(true);
      setLoading(false);
      setIsLogin(true);
      // send emp id for extension
      sendEmpIdtoExtension(decodedData._id, response.data);
      const roles = { "1": "admin", "2": "hr", "3": "emp", "4": "manager", "5": "sys-admin" };
      setWhoIs(roles[String(localStorage.getItem("Account"))] || "");
      navigate(`/${roles[String(localStorage.getItem("Account"))]}`);
    } catch (error) {
      setPass(false);
      setLoading(false);
      if (error?.response?.data?.details?.includes("buffering timed out after 10000ms")) {
        navigate("/no-internet-connection");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    }
  };

  function sendNotification(emps, companyLogo, title, message) {
    console.log("getting notification");

    if (emps?.includes(data._id)) {
      const companyName = "Webnexs";
      toast.success("success");
      // toaster.push(
      //   <Notification
      //     header={
      //       <div style={{ display: 'flex', alignItems: 'center' }}>

      //         <img src={companyLogo} alt="Company Logo" style={{ width: 50, height: 50, marginRight: 10 }} />

      //         <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{companyName}</span>
      //       </div>
      //     }
      //     closable
      //   >
      //     <strong>{title}</strong>
      //     <br />
      //     {message}
      //   </Notification>,
      //   { placement: 'bottomEnd' }
      // );
    }
  }
  // useEffect(() => {
  //   socket.connect(); // Correct way to initiate connection

  //   // socket.on("connect", () => {
  //   //   console.log("Connected to server");
  //   //   socket.emit("get-data", "hi");
  //   // });

  //   // Listen for a response from the server
  //   socket.on("data-response", (data) => {
  //     console.log("Received from server:", data);
  //   });

  //   // Cleanup function to prevent memory leaks
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setPass(true);
    login(event.target[0].value, event.target[1].value);
    event.target.reset();
  };

  // Effects
  useEffect(() => {
    localStorage.setItem("isStartLogin", isStartLogin);
    localStorage.setItem("isStartActivity", isStartActivity);
  }, [isStartLogin, isStartActivity]);

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      _id: localStorage.getItem("_id") || "",
      Account: localStorage.getItem("Account") || "",
      Name: localStorage.getItem("Name") || "",
      token: localStorage.getItem("token") || "",
      annualLeave: localStorage.getItem("annualLeaveEntitment") || 0,
    }))
    const roles = { "1": "admin", "2": "hr", "3": "emp", "4": "manager", "5": "sys-admin" };
    setWhoIs(roles[String(localStorage.getItem("Account"))] || "");

    if (window.location.pathname !== "/login" || window.location.pathname !== `/${whoIs}`) {
      if (roles[String(localStorage.getItem("Account"))]) {
        replaceMiddleSegment()
      }
    }
  }, []);
  console.log(whoIs);


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

  useEffect(() => {

    if (!isOnline && showOfflineAlert) {
      navigate("/no-internet-connection")
    } else if (isOnline && !showOfflineAlert && location.pathname === "/no-internet-connection") {
      navigate(`/${whoIs}`)
    }
  }, [isLogin, showOfflineAlert])

  // Component Rendering
  return (
    <EssentialValues.Provider
      value={{
        data,
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
        sendNotification
      }}
    >
      <ToastContainer />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="/" element={whoIs ? <Navigate to={`/${whoIs}`} /> : <Navigate to="/login" />} />
        <Route
          path={`${whoIs}/*`}
          element={isLogin && whoIs && data.token ? <HRMDashboard /> : <Navigate to="/login" />}
        />
        {/* <Route
          path="hr/*"
          element={isLogin && whoIs === "hr" && data.token ? <HRMDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="emp/*"
          element={isLogin && whoIs && data.token ? <HRMDashboard /> : <Navigate to="/login" />}
        /> */}
        <Route path="no-internet-connection" element={<NoInternet />} />
        <Route path="*" element={<h1>404</h1>} />
      </Routes>
    </EssentialValues.Provider>
  );
};

export default App;
