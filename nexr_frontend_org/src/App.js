import React, { useState, createContext, useEffect } from "react";
import "./App.css";
import axios from "axios";
import Layout from "./components/Layout";
import Login from "./components/Login.jsx";
import HRMDashboard from "./components/payslip/HRMDashboard.jsx";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { jwtDecode } from "jwt-decode"; // Fixed import
import "react-toastify/dist/ReactToastify.css";
import NoInternet from "./components/NoInternet.jsx";
import Cookies from "universal-cookie";

// Context
export const EssentialValues = createContext(null);

const App = () => {
  const url = process.env.REACT_APP_API_URL;
  const cookies = new Cookies();
  const navigate = useNavigate();
  const cen_url = process.env.CENTRALIZATION_BASEURL;
  const [token, setToken] = useState(cookies.get("token") || "");
  const [isLogin, setIsLogin] = useState(!!cookies.get("isLogin"));
  const [isStartLogin, setIsStartLogin] = useState(!!cookies.get("isStartLogin"));
  const [isStartActivity, setIsStartActivity] = useState(!!cookies.get("isStartActivity"));
  const [data, setData] = useState({ _id: "", Account: "", Name: "" });
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(true);

  // Decode JWT and handle invalid token
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const { Account, _id, FirstName, LastName } = decoded;
        setData({
          _id,
          Account,
          Name: `${FirstName} ${LastName}` || "",
        });
      } catch (err) {
        console.error("Invalid token", err);
        setToken("");
        cookies.remove("token");
      }
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;
    setPass(true);
    setLoading(true);
    await login(email, password);
    event.target.reset();
  };

  const handleLogout = () => {
    if (isStartLogin || isStartActivity) {
      toast.warn("You can't logout until the timer is stopped.");
      return;
    }

    setIsLogin(false);
    cookies.remove("isLogin", { path: "/" });
    cookies.remove("token", { path: "/" });
    setData({ _id: "", Account: "", Name: "" });
    navigate("/login");
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${url}/api/login`, { Email: email, Password: password });
      const decodedData = jwtDecode(response.data);

      cookies.set("token", response.data, { path: "/" });
      setToken(response.data);

      setData({
        _id: decodedData._id,
        Account: decodedData.Account,
        Name: `${decodedData.FirstName} ${decodedData.LastName}`,
      });

      setIsLogin(true);
      cookies.set("isLogin", true, { path: "/" });

      // Navigate based on account type
      const accountRoutes = {
        1: "/admin",
        2: "/hr",
        3: "/emp",
      };
      navigate(accountRoutes[decodedData.Account] || "/login");
    } catch (error) {
      setPass(false);
      setLoading(false);
      if (error.response?.data?.details?.includes("buffering timed out")) {
        navigate("/no-internet-connection");
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  };

  // const login = async (email, password) => {
  //   const verifyUserEmail = await axios.post(`${cen_url}/verify_user`, email)
  //   if(verifyUserEmail.data.status === "true"){
  //     const loginData = {
  //       email,
  //       password,
  //       loginfrom: 3
  //     }
  //     const loginEmp = await axios.post(`${cen_url}/login`, loginData);
  //     const decodedData = jwtDecode(loginEmp.data.token);
  //     const userId = decodedData.user_details._id;
  //     const empData = await axios.get()
  //   }
  // }

  useEffect(() => {
    cookies.set("isStartLogin", isStartLogin, { path: "/" });
    cookies.set("isStartActivity", isStartActivity, { path: "/" });
  }, [isStartLogin, isStartActivity]);

  // useEffect(() => {
  //   const checkNetworkConnection = async () => {
  //     try {
  //       await axios.get(`${url}/`);
  //       if (isLogin && window.location.pathname === "/") {
  //         const accountRoutes = {
  //           1: "/admin",
  //           2: "/hr",
  //           3: "/emp",
  //         };
  //         navigate(accountRoutes[data.Account] || "/login");
  //       }
  //     } catch {
  //       navigate("/no-internet-connection");
  //     }
  //   };
  //   checkNetworkConnection();
  // }, [isLogin, data.Account, navigate, url]);

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
        setIsStartActivity,
        token
      }}
    >
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login isLogin={isLogin} />} />

        {/* Main route with conditional rendering based on login state */}
        <Route
          path="/"
          element={isLogin && token ? <Layout /> : <Navigate to="/login" />}
        >
          <Route path="*" element={<Layout />} />
        </Route>

        {/* Conditional routes based on the account type */}
        {isLogin && data?.Account && (
          <>
            <Route
              path="admin/*"
              element={
                Number(data.Account) === 1 ? <HRMDashboard /> : <Navigate to="/login" />
              }
            />
            <Route
              path="hr/*"
              element={
                Number(data.Account) === 2 ? <HRMDashboard /> : <Navigate to="/login" />
              }
            />
            <Route
              path="emp/*"
              element={
                Number(data.Account) === 3 ? <HRMDashboard /> : <Navigate to="/login" />
              }
            />
          </>
        )}

        {/* Example of a fallback route */}
        <Route path="no-internet-connection" element={<NoInternet />} />
      </Routes>
    </EssentialValues.Provider>

  );
};

export default App;
