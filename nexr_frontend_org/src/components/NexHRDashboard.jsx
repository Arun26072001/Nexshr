import { Card } from "@mui/material";
import Home from "./Home";
import React, { useContext } from "react";
import CircleProgressBar from "./CircleProgressBar";
import Twotabs from "./TwoTabs";
import "./NexHRDashboard.css";
import { EssentialValues } from "../App";
import { jwtDecode } from "jwt-decode";

const NexHRDashboard = ({ peopleOnLeave, isFetchPeopleOnLeave }) => {
  const { data } = useContext(EssentialValues);
  const { token, Account, _id } = data;
  const { isTeamLead, isTeamHead, isTeamManager } = jwtDecode(token);

  return (
    <div className="row">
      <div className="col-lg-8 col-md-12 col-12" >
        {/* Left card */}
        <Card style={{ height: '100%', boxShadow: "none" }} >
          {(Account === '2' || [isTeamLead, isTeamHead, isTeamManager].includes(true)) &&
            <>
              <div className="d-flex align-items-center justify-content-between m-2">
                <span className="bold m-2">
                  OVERVIEW
                </span>
                {/* <NavLink to={`/${whoIs}/leave-request`}>
                  <button className="button">+ Add Time of</button>
                </NavLink> */}
              </div>
              <CircleProgressBar token={token} isTeamLead={isTeamLead} isTeamManager={isTeamManager} account={Account} id={_id} isTeamHead={isTeamHead} />
            </>
          }
          <Home peopleOnLeave={peopleOnLeave} isFetchPeopleOnLeave={isFetchPeopleOnLeave} />
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

