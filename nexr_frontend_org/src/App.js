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

export const EssentialValues = createContext(null);
const App = () => {
  const account = localStorage.getItem("Account");
  const isStartLogin = localStorage.getItem('isStartLogin') === "false" ? false : true
  const isStartActivity = localStorage.getItem('isStartActivity') === "false" ? false : true
  const [data, setData] = useState({
    _id: localStorage.getItem("_id") || "",
    Account: localStorage.getItem("Account") || "",
    Name: localStorage.getItem("Name") || ""
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(true);
  const [isLogin, setIsLogin] = useState(localStorage.getItem("isLogin") === "true");

  const handleSubmit = async event => {
    event.preventDefault();
    setPass(true);
    setLoading(true);
    await login(event.target[0].value, event.target[1].value);
    event.target.reset();
  };

  const handleLogout = () => {
    if (localStorage.getItem('empId')) {
      toast.warn(`Please Enter full details for this employee`);
      
    } else if (isStartLogin || isStartActivity) {
      toast.warn("you can't logout until timer stop.")
    } else {
      localStorage.clear();
      setData({
        _id: "",
        Account: "",
        Name: ""
      });
      setIsLogin(false);
      navigate("/login")
    }

  };

  const login = async (id, pass) => {
    let bodyLogin = {
      Email: id,
      Password: pass
    };
    try {
      const login = await axios.post(process.env.REACT_APP_API_URL + "/api/login", bodyLogin)
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
          Name: `${decodedData.FirstName} ${decodedData.LastName}`
        });

        setPass(true);
        setLoading(false);
        setIsLogin(true);

        localStorage.setItem("isLogin", true);
        localStorage.setItem("Account", accountType);
        localStorage.setItem("_id", decodedData._id);
        localStorage.setItem("Name", `${decodedData.FirstName} ${decodedData.LastName}`);
        localStorage.setItem("annualLeaveEntitment", decodedData.annualLeaveEntitlement);

        window.location.reload();

        if (accountType === 1) {
          navigate("/admin");
        } else if (accountType === 2) {
          navigate("/hr");
        } else if (accountType === 3) {
          navigate("/emp");
        }
      }
    } catch (error) {
      console.log(error);
      setPass(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const navigateToAccount = () => {
      if (isLogin && window.location.pathname === "/") {
        if (account === '1') {
          navigate("/admin")
        } else if (account === '2') {
          navigate("/hr")
        } else if (account === '3') {
          navigate("/emp")
        }
      }
    }
    navigateToAccount()
  }, [data]);


  return (
    <EssentialValues.Provider value={{ data, handleLogout, handleSubmit, loading, pass, isLogin }}>
      <ToastContainer />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="/" element={isLogin ? <Layout /> : <Navigate to={"/login"} />} >
          <Route path="*" element={<Layout />} />
        </Route>
        <Route path=":who/*" element={isLogin && account === '1' ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="hr/*" element={isLogin && account === '2' ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="emp/*" element={isLogin && account === '3' ? <HRMDashboard /> : <Navigate to={"/login"} />} />
      </Routes>
    </EssentialValues.Provider>
  );
};

export default App;