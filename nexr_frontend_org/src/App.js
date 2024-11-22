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
import Cookies from 'universal-cookie';

// check to update
export const EssentialValues = createContext(null);
const App = () => {
  const url = process.env.REACT_APP_API_URL;
  const cookies = new Cookies();
  const token = cookies.get("token");
  const {
    Account, _id, FirstName, LastName
  } = jwtDecode(token);
  const [isStartLogin, setIsStartLogin] = useState(cookies.get("isStartLogin") === "false" ? false : cookies.get("isStartLogin") === "true" ? true : false);
  const [isStartActivity, setIsStartActivity] = useState(cookies.get("isStartActivity") === "false" ? false : cookies.get("isStartActivity") === "true" ? true : false);
  const [data, setData] = useState({
    _id: _id || "",
    Account: Account || "",
    Name: FirstName || ""
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(true);
  const [isLogin, setIsLogin] = useState(cookies.get("isLogin") || false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPass(true);
    setLoading(true);
    await login(event.target[0].value, event.target[1].value);
    event.target.reset();
  };

  const handleLogout = () => {
    // console.log(isStartLogin, isStartActivity);
    // if (localStorage.getItem('empId')) {
    //   toast.warn(`Please Enter full details for this employee`);
    //   console.log(isStartLogin, isStartActivity);
    // } else
    if (isStartLogin || isStartActivity) {
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

  const login = async (email, pass) => {
    let bodyLogin = {
      Email: email,
      Password: pass
    };

    try {
      const login = await axios.post(process.env.REACT_APP_API_URL + `/api/login`, bodyLogin)
      let decodedData = jwtDecode(login.data);
      console.log(decodedData);

      cookies.set("token", login.data, "/");
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
        cookies.set("isLogin", true);

        if (!cookies.get("token")) {
          window.location.reload();
        }

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
    cookies.set("isStartLogin", isStartLogin, { path: "/" });
    cookies.set("isStartActivity", isStartActivity, { path: "/" });
  }, [isStartLogin, isStartActivity]);

  useEffect(() => {
    async function checkNetworkConnection() {
      console.log("call ini");

      try {
        const connectionMsg = await axios.get(`${url}/`);
        if (isLogin && window.location.pathname === "/") {
          console.log(Account);

          if (Account === 1) {
            navigate("/admin")
          } else if (Account === 2) {
            navigate("/hr")
          } else if (Account === 3) {
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
        <Route path="/" element={isLogin ? <Layout /> : <Navigate to={"/login"} />} >
          <Route path="*" element={<Layout />} />
        </Route>
        <Route path="admin/*" element={isLogin && Account === 1 ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="hr/*" element={isLogin && Account === 2 ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="emp/*" element={isLogin && Account === 3 ? <HRMDashboard /> : <Navigate to={"/login"} />} />
        <Route path="no-internet-connection" element={<NoInternet />} />
      </Routes>
    </EssentialValues.Provider>
  );
};

export default App;