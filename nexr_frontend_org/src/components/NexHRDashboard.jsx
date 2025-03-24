import { Card } from "@mui/material";
import Home from "./Home";
import React, { useContext } from "react";
import CircleProgressBar from "./CircleProgressBar";
import { NavLink } from "react-router-dom";
import Twotabs from "./TwoTabs";
import "./NexHRDashboard.css";
import { EssentialValues } from "../App";
import { jwtDecode } from "jwt-decode";

const NexHRDashboard = ({ updateClockins }) => {
  const { whoIs, data } = useContext(EssentialValues);
  const { token, Account, _id } = data;
  const { isTeamLead, isTeamHead } = jwtDecode(token);
  
  return (
    <div className="row">
      <div className="col-lg-8 col-md-12 col-12" >
        {/* Left card */}
        <Card style={{ border: '2px solid rgb(208 210 210)', height: '100%' }}>
          {(Account === '2' || isTeamLead || isTeamHead) &&
            <>
              <div className="d-flex align-items-center justify-content-between m-2">
                <span className="bold m-2">
                  OVERVIEW
                </span>
                <NavLink to={`/${whoIs}/leave-request`}>
                  <button className="button">+ Add Time of</button>
                </NavLink>
              </div>
              <CircleProgressBar token={token} isTeamLead={isTeamLead} account={Account} id={_id} isTeamHead={isTeamHead} />
            </>
          }
          <Home updateClockins={updateClockins} />
        </Card>
      </div>
      <div className="col-lg-4 col-md-8 col-12 d-flex jsutify-content-center">
        {/* right Card */}
        <Twotabs />
      </div>
    </div>
  )
};

export default NexHRDashboard;

