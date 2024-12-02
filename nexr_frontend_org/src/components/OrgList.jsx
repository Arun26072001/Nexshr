import React, { useContext, useEffect } from "react";
import "./org_list.css";
import Logo from "../imgs/webnexs_logo.png";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { EssentialValues } from "../App";

const OrgList = ({ org, goToDash }) => {
    const cookies = new Cookies();
    const navigator = useNavigate();
    const {data} = useContext(EssentialValues);
    const {Account, orgId} = data;

    useEffect(() => {
        if (Account === 1) {
            navigator(`/${orgId}/admin`)
        } else if (Account === 2) {
            navigator(`/${orgId}/hr`)
        } else if (Account === 3) {
            navigator(`/${orgId}/emp`)
        }
    }, [Account, orgId])
    return (
        <div className="main-outer-div">
            {org?.map((orgData, index) => {
                return <div key={index} className="org_card" onClick={() => goToDash(orgData._id)}>
                    <img className="org_logo" src={Logo} alt={orgData.orgName} />
                    <p className="org_name">{orgData.orgName[0].toUpperCase() + orgData.orgName.slice(1)}</p>
                </div>
            })}
        </div>
    )
};

export default OrgList;
