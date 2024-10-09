import {Card} from "@mui/material";
import Home from "./Home";
import React from "react";
import CircleProgressBar from "./CircleProgressBar";
import { NavLink } from "react-router-dom";
import Twotabs from "./TwoTabs";
import "./NexHRDashboard.css";

const NexHRDashboard = ({updateClockins}) => {
  const account = localStorage.getItem("Account");


  return (
    
      account === '2' &&
    (<div className="row mx-auto">
      {/* <ClockIns /> */}
      <div className="col-lg-8 col-md-8 col-12" >
        {/* Left card */}
        <Card style={{ border: '2px solid rgb(208 210 210)', height: '100%' }}>
          <div className="d-flex align-items-center justify-content-between m-2">
            <span className="bold m-2">
              OVERVIEW
            </span>
            <NavLink to={"/hr/leave-request"}>
              <button className="button">+ Add Time of</button>
            </NavLink>
          </div>
          <CircleProgressBar />
          <Home updateClockins={updateClockins} />
        </Card>
      </div>
      <div className="col-lg-4 col-md-4 col-12">
        {/* right Card */}
        <Twotabs />
      </div>
    </div>)
  )
};

export default NexHRDashboard;

