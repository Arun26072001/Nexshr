import React, { useState, createContext, useEffect } from "react";
import "./App.css";
import axios from "axios";
import Layout from "./components/Layout";
import Login from "./components/Login.jsx";
import HRMDashboard from "./components/payslip/HRMDashboard.jsx";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";
import NoInternet from "./components/NoInternet.jsx";

// check to update
export const EssentialValues = createContext(null);
const App = () => {
  const url = process.env.REACT_APP_API_URL;
  const [isStartLogin, setIsStartLogin] = useState(localStorage.getItem("isStartLogin") === "false" ? false : localStorage.getItem("isStartLogin") === "true" ? true : false);
  const [isStartActivity, setIsStartActivity] = useState(localStorage.getItem("isStartActivity") === "false" ? false : localStorage.getItem("isStartActivity") === "true" ? true : false);
  const [data, setData] = useState({
    _id: localStorage.getItem("_id") || "",
    Account: localStorage.getItem("Account") || "",
    Name: localStorage.getItem("Name") || "",
    token: localStorage.getItem("token") || "",
    annualLeave: localStorage.getItem("annualLeaveEntitment") || 0
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(true);
  const [isLogin, setIsLogin] = useState(localStorage.getItem("isLogin") === "true");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPass(true);
    setLoading(true);
    await login(event.target[0].value, event.target[1].value);
    event.target.reset();
  };

  const handleLogout = () => {
    // console.log(isStartLogin, isStartActivity);
    // // if (localStorage.getItem('empId')) {
    // //   toast.warn(`Please Enter full details for this employee`);
    // //   console.log(isStartLogin, isStartActivity);
    // // }
    // //  else
    if (isStartLogin || isStartActivity) {
      toast.warn("you can't logout until timer stop.")
    } else {
      localStorage.clear();
      setData({
        _id: "",
        Account: "",
        Name: "",
        token: "",
        annualLeave: ""
      });
      setIsLogin(false);
      navigate("/login")
    }

  };
  const login = async (email, pass) => {
    let bodyLogin = {
      Email: email,
      Password: pass
    };

    try {
      const login = await axios.post(process.env.REACT_APP_API_URL + `/api/login`, bodyLogin)
      let decodedData = jwtDecode(login.data);
      localStorage.setItem("token", login.data);
      if ((login === undefined || login === null ||
        decodedData.Account === undefined ||
        decodedData.Account === null) &&
        !(
          decodedData.Account === 1 ||
          decodedData.Account === 2 ||
          decodedData.Account === 3
        )
      ) {
        setPass(false);
        setLoading(false);
      } else {
        const accountType = decodedData.Account;
        setData({
          _id: decodedData._id,
          Account: accountType,
          Name: `${decodedData.FirstName} ${decodedData.LastName}`,
          token: login.data,
          annualLeave: decodedData.annualLeaveEntitlement
        });

        setPass(true);
        setLoading(false);
        setIsLogin(true);

        localStorage.setItem("isLogin", true);
        localStorage.setItem("Account", accountType);
        localStorage.setItem("_id", decodedData._id);
        localStorage.setItem("Name", `${decodedData.FirstName} ${decodedData.LastName}`);
        localStorage.setItem("annualLeaveEntitment", decodedData.annualLeaveEntitlement || 0);
        // localStorage.setItem("userPermissions", JSON.stringify(decodedData.roleData.userPermissions))

        // Object.entries(decodedData.roleData.pageAuth).forEach(([key, value]) => {
        //   if (key !== '_id' && key !== "__v") {
        //     return localStorage.setItem(`${key}`, value)
        //   }
        // })
        // if (!localStorage.getItem("token")) {
        //   window.location.reload();
        // }

        if (accountType === 1) {
          navigate("/admin");
        } else if (accountType === 2) {
          navigate("/hr");
        } else if (accountType === 3) {
          navigate("/emp");
        }
      }
    } catch (error) {
      if (error?.response?.data?.details?.includes("buffering timed out after 10000ms")) {
        navigate("/no-internet-connection")
      }
      setPass(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("isStartLogin", isStartLogin);
    localStorage.setItem("isStartActivity", isStartActivity);
  }, [isStartLogin, isStartActivity]);

  useEffect(() => {
    async function checkNetworkConnection() {
      try {
        const connectionMsg = await axios.get(`${url}/`);
        if (isLogin && window.location.pathname === "/") {
          if (data.Account === '1') {
            navigate("/admin")
          } else if (data.Account === '2') {
            navigate("/hr")
          } else if (data.Account === '3') {
            navigate("/emp")
          }
        }
      } catch (error) {
        if (error) {
          navigate("/no-internet-connection");
        }
      }
    }
    checkNetworkConnection();
  }, [data]);
  
  return (
    <EssentialValues.Provider value={{ data, handleLogout, handleSubmit, loading, pass, isLogin, isStartLogin, setIsStartLogin, isStartActivity, setIsStartActivity }}>
      <ToastContainer />
      <Routes>
        <Route path="login/" element={<Login />} />
        {/* <Route path="/" element={isLogin ? <Layout /> : <Navigate to={"/login"} />} >
          <Route path="*" element={<Layout />} />
        </Route> */}
        <Route path="admin/*" element={isLogin && data.token && String(data.Account) === '1' ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="hr/*" element={isLogin && data.token && String(data.Account) === '2' ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="emp/*" element={isLogin && data.token && String(data.Account) === '3' ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="no-internet-connection" element={<NoInternet />} />
      </Routes>
    </EssentialValues.Provider>
  );
};

export default App;