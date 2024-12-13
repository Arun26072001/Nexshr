import React, { useState, createContext, useEffect } from "react";
import "./App.css";
import axios from "axios";
import Layout from "./components/Layout";
import Login from "./components/Login.jsx";
import HRMDashboard from "./components/payslip/HRMDashboard.jsx";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NoInternet from "./components/NoInternet.jsx";
import { jwtDecode } from "jwt-decode";

export const EssentialValues = createContext(null);

const App = () => {
  const url = process.env.REACT_APP_API_URL;

  // State Variables
  const [whoIs, setWhoIs] = useState("");
  const [isStartLogin, setIsStartLogin] = useState(localStorage.getItem("isStartLogin") === "true");
  const [isStartActivity, setIsStartActivity] = useState(localStorage.getItem("isStartActivity") === "true");
  const [data, setData] = useState({
    _id: localStorage.getItem("_id") || "",
    Account: localStorage.getItem("Account") || "",
    Name: localStorage.getItem("Name") || "",
    token: localStorage.getItem("token") || "",
    annualLeave: localStorage.getItem("annualLeaveEntitment") || 0,
  });
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(true);
  const [isLogin, setIsLogin] = useState(localStorage.getItem("isLogin") === "true");
  const navigate = useNavigate();

  // Helper Functions
  const handleLogout = () => {
    if (isStartLogin || isStartActivity) {
      toast.warn("You can't logout until the timer stops.");
      return;
    }
    localStorage.clear();
    setData({ _id: "", Account: "", Name: "", token: "", annualLeave: 0 });
    setWhoIs("");
    setIsLogin(false);
    navigate("/login");
  };

  const assignWhoIs = (accountType) => {
    const roles = { "1": "admin", "2": "hr", "3": "emp" };
    setWhoIs(roles[String(accountType)] || "");
    navigate(`/${roles[String(accountType)]}`)
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/login`, { Email: email, Password: password });
      const decodedData = jwtDecode(response.data);

      if (!decodedData.Account || !["1", "2", "3"].includes(String(decodedData.Account))) {
        throw new Error("Invalid account type.");
      }

      const accountType = decodedData.Account;
      setData({
        _id: decodedData._id,
        Account: accountType,
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
      assignWhoIs(accountType);

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
    if (data.Account) {
      assignWhoIs(data.Account);
    }
  }, [data.Account]);

  // useEffect(() => {
  //   const checkNetworkConnection = async () => {
  //     try {
  //       await axios.get(`${url}/`);
  //       if (isLogin && window.location.pathname === "/") {
  //         navigate(`/${whoIs}`);
  //       }
  //     } catch {
  //       navigate("/no-internet-connection");
  //     }
  //   };
  //   checkNetworkConnection();
  // }, [isLogin, whoIs]);
  // console.log(whoIs);

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
      }}
    >
      <ToastContainer />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          path="/"
          element={
            whoIs !== undefined
              ? <Navigate to={`/${whoIs}`} />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="admin/*"
          element={isLogin && whoIs === "admin" && data.token ? <HRMDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="hr/*"
          element={isLogin && whoIs === "hr" && data.token ? <HRMDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="emp/*"
          element={isLogin && whoIs === "emp" && data.token ? <HRMDashboard /> : <Navigate to="/login" />}
        />
        <Route path="no-internet-connection" element={<NoInternet />} />
      </Routes>
    </EssentialValues.Provider>
  );
};

export default App;
