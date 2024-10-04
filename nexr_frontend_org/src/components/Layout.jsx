import React, { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom";

const Layout = () => {
    // useEffect(()=>{
    //     if(window.location.pathname == "/" || "*") {
    //         return navigate("login");
    //     }
    // },[])

   
  return (
    <div>
      <Outlet />
    </div>
  )
};

export default Layout;
