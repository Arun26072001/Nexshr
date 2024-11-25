import { Card } from "@mui/material";
import Home from "./Home";
import React, { useContext } from "react";
import CircleProgressBar from "./CircleProgressBar";
import { NavLink } from "react-router-dom";
import Twotabs from "./TwoTabs";
import "./NexHRDashboard.css";
import { TimerStates } from "./payslip/HRMDashboard";
import { EssentialValues } from "../App";

const NexHRDashboard = ({ updateClockins }) => {
  const { whoIs } = useContext(TimerStates);
  const {data} = useContext(EssentialValues);
  const {Account} = data;
  
  return (

    (<div className="row">
      {/* <ClockIns /> */}
      <div className="col-lg-8 col-md-8 col-12" >
        {/* Left card */}
        <Card style={{ border: '2px solid rgb(208 210 210)', height: '100%' }}>
          {Account === '2' &&
            <>
              <div className="d-flex align-items-center justify-content-between m-2">
                <span className="bold m-2">
                  OVERVIEW
                </span>
                <NavLink to={`/${whoIs}/leave-request`}>
                  <button className="button">+ Add Time of</button>
                </NavLink>
              </div>
              <CircleProgressBar />
            </>
          }
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

