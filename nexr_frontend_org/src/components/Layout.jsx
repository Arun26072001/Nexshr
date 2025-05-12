import React, { useContext, useEffect } from "react"
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { EssentialValues } from "../App";

const Layout = ({ isLogin }) => {
  const navigate = useNavigate();
  const { data } = useContext(EssentialValues);
  useEffect(() => {
    // localStorage.setItem("orgId", id)
    if (data.Account === 1 && isLogin) {
      navigate("/admin")
    }
    else if (data.Account === 2 && isLogin) {
      navigate("/hr")
    } else if (data.Account === 3 && isLogin) {
      navigate("/emp")
    }
  }, []);


  return (
    <div>
      <Outlet />
    </div>
  )
};

export default Layout;
