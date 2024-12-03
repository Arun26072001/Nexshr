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
import OrgList from "./components/OrgList.jsx";
import { fetchEmployeeData } from "./components/ReuseableAPI.jsx";

// Context
export const EssentialValues = createContext(null);

const App = () => {
  const cookies = new Cookies();
  const [org, setOrg] = useState(null);
  const [orgIds, setOrgIds] = useState(cookies.get("orgIds") || "")
  const url = process.env.REACT_APP_API_URL;
  const cen_url = process.env.REACT_APP_CENTRALIZATION_BASEURL;
  const navigate = useNavigate();
  const [token, setToken] = useState(cookies.get("token") || "");
  const [isLogin, setIsLogin] = useState(cookies.get("isLogin") || "");
  const [isStartLogin, setIsStartLogin] = useState(!!cookies.get("isStartLogin"));
  const [isStartActivity, setIsStartActivity] = useState(!!cookies.get("isStartActivity"));
  const [data, setData] = useState({ _id: "", email: "", name: "", Account: 0, orgId: "" });
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    async function getData() {
      try {
        const { _id, Email, FirstName, LastName, Account, profile } = await fetchEmployeeData(cookies.get("email"))

        setData({
          _id,
          email: Email || "",
          name: FirstName + LastName || "",
          Account: Account || 0,
          orgId: cookies.get("orgId") || "",
          profile
        });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    if (token) {
      getData();
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
    cookies.remove("name", { path: "/" })
    cookies.remove("Account", { path: "/" })
    cookies.remove("isLogin", { path: "/" });
    // cookies.remove("token", { path: "/" });
    cookies.remove("orgId", { path: "/" })
    setData({ _id: "", Account: "", name: "", orgId: "" });
    navigate("/login");
  };


  const goToDash = async (orgId) => {
    console.log(orgId);

    try {
      const emp = await axios.get(`${url}/api/employee/${orgId}/${data.email}`, {
        headers: {
          Authorization: `Bearer ${token}` || ""
        }
      });
      console.log(emp);
      
      setData((prev) => ({
        ...prev,
        Account: emp.data.Account,
        name: emp.data.FirstName + " " + emp.data.LastName,
        orgId,
        profile: emp.data.profile,
        _id: emp.data._id
      }))
      cookies.set("empId", emp.data._id, { path: "/" })
      cookies.set("orgId", orgId, { path: "/" });
      // Navigate based on account type
      const accountRoutes = {
        1: "/admin",
        2: "/hr",
        3: "/emp",
      };
      navigate(`/${orgId}${accountRoutes[emp.data.Account]}` || "/login");
    } catch (error) {
      console.log(error);
    }
  }

  // const login = async (email, password) => {
  //   try {
  //     const response = await axios.post(`${url}/api/login`, { Email: email, Password: password });
  //     const decodedData = jwtDecode(response.data);

  //     cookies.set("token", response.data, { path: "/" });
  //     setToken(response.data);

  //     setData({
  //       _id: decodedData._id,
  //       Account: decodedData.Account,
  //       Name: `${decodedData.FirstName} ${decodedData.LastName}`,
  //     });

  //     setIsLogin(true);
  //     cookies.set("isLogin", true, { path: "/" });

  //     // Navigate based on account type
  //     const accountRoutes = {
  //       1: "/admin",
  //       2: "/hr",
  //       3: "/emp",
  //     };
  //     navigate(accountRoutes[decodedData.Account] || "/login");
  //   } catch (error) {
  //     setPass(false);
  //     setLoading(false);
  //     if (error.response?.data?.details?.includes("buffering timed out")) {
  //       navigate("/no-internet-connection");
  //     } else {
  //       toast.error("Login failed. Please try again.");
  //     }
  //   }
  // };

  const login = async (email, password) => {
    try {
      setLoading(true); // Start loading

      // Step 1: Verify User Email
      const verifyUserEmail = await axios.post(`${cen_url}/verify_user`, { email_id: email });
      // console.log(verifyUserEmail.data);

      if (!verifyUserEmail.data.user_details._id) {
        setLoading(false);
        setPass(false);
        console.error("Email verification failed.");
        return; // Exit early
      }

      const userDetails = verifyUserEmail.data.user_details;
      if (!userDetails || !userDetails.email_id) {
        setLoading(false);
        setPass(false);
        console.error("User details not found.");
        return; // Exit early
      }

      // Step 2: Login User
      const loginData = {
        email_id: email,
        password,
        loginfrom: 3,
      };
      const loginEmp = await axios.post(`${cen_url}/login`, loginData);

      if (!loginEmp.data || loginEmp.data.status === "false") {
        setLoading(false);
        setPass(false);
        console.error("Login failed.");
        return; // Exit early
      }

      // Step 3: Set User Data and Token
      const token = loginEmp.data.token;
      const user = loginEmp.data.user_details;

      cookies.set("token", token, { path: "/" });
      cookies.set("isLogin", true, { path: "/" });
      cookies.set("email", user.email_id, { path: "/" })
      setIsLogin(true);
      setToken(token);
      setData({
        cen_user_id: user._id,
        email: user.email_id,
        name: user.name,
      });

      // Step 4: Fetch Essential Data
      const essentialData = await axios.post(`${cen_url}/view`, { token });

      const orgIds = essentialData.data?.user_details?.nexhr_organisations?.split(",") || [];
      cookies.set("orgIds", essentialData.data?.user_details?.nexhr_organisations, { path: "/" });

      if (orgIds.length > 0) {
        // Multiple organizations
        const orgsData = await axios.post(`${url}/api/organization`, { orgs: orgIds });
        setOrg(orgsData.data);
        navigate("/org-list");
      } else {
        // Single organization
        const orgId = essentialData?.data?.user_details?.nexhr_organisations;
        const orgData = await axios.get(`${url}/api/organization/${orgId}`);
        setOrg(orgData.data);
        goToDash(orgData.data._id);
      }

    } catch (error) {
      console.error("An error occurred during login:", error.message);
      setLoading(false);
      setPass(false); // Reset states on failure
    } finally {
      setLoading(false); // Ensure loading stops
    }
  };

  useEffect(() => {
    localStorage.setItem("isStartLogin", isStartLogin);
    localStorage.setItem("isStartActivity", isStartActivity);
  }, [isStartLogin, isStartActivity]);

  useEffect(() => {
    const getOrgdata = async () => {
      try {
        const arrayId = orgIds?.split(",");
        if (arrayId.length > 0) {
          const orgsData = await axios.post(`${url}/api/organization`, { orgs: arrayId });
          setOrg(orgsData.data);
          navigate("/org-list");
        } else {
          const orgData = await axios.get(`${url}/api/organization/${orgIds}`);
          setOrg(orgData.data);
        }
      } catch (error) {
        console.log(error);

        setPass(true);
        toast.error(error.message)
      }
    }

    if (orgIds && token) {
      getOrgdata()
    }
  }, [])

  // useEffect(() => {
  //   const handleOnline = () => {
  //     setIsOnline(true);
  //     setShowOfflineAlert(true);
  //     setTimeout(() => {
  //       setShowOfflineAlert(false);
  //     }, 5000);
  //   };

  //   const handleOffline = () => {
  //     setIsOnline(false);
  //     setShowOfflineAlert(true);
  //   };

  //   window.addEventListener('online', handleOnline);
  //   window.addEventListener('offline', handleOffline);

  //   return () => {
  //     window.removeEventListener('online', handleOnline);
  //     window.removeEventListener('offline', handleOffline);
  //   };
  // }, []);
  console.log(data.Account);

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
          element={token && org?.length > 0 ? <OrgList goToDash={goToDash} org={org} /> : <Navigate to="/login" />}
        >
          <Route path="*" element={<Layout />} />
        </Route>

        <Route path="/org-list" element={token && org?.length > 0 ? <OrgList goToDash={goToDash} org={org} /> : <Navigate to={"/login"} />} />

        {/* Conditional routes based on the account type */}
        {isLogin && data?.Account && (
          <>
            <Route
              path="/:orgId/admin/*"
              element={
                Number(data.Account) === 1 ?
                  <HRMDashboard /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/:orgId/hr/*"
              element={
                Number(data.Account) === 2 ? <HRMDashboard /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/:orgId/emp/*"
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
