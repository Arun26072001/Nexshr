import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import "./payslip.css";

export default function PayslipRouter({whoIs}) {
    const [payslip, setPayslip] = useState("");

    return (
        <>
            <div className="payslipParent">
                <NavLink to={`/${whoIs}/job-desk/`}>
                    <div className={`text-secondary ${payslip === "" && "selected"}`} onClick={() => setPayslip("")}>Attendance</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/leave/`}>
                    <div className={`text-secondary ${payslip === "leave" && "selected"}`} onClick={() => setPayslip("leave")}>Leave</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/folder`}>
                    <div className={`text-secondary ${payslip === "folder" && "selected"}`} onClick={() => setPayslip("folder")}>Folder</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/assets`}>
                    <div className={`text-secondary ${payslip === "assets" && "selected"}`} onClick={() => setPayslip("assets")}>Assets</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/history`}>
                    <div className={`text-secondary ${payslip === "history" && "selected"}`} onClick={() => setPayslip("history")}>History</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/salary`}>
                    <div className={`text-secondary ${payslip === "salary" && "selected"}`} onClick={() => setPayslip("salary")}>Salary</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/payrun`}>
                    <div className={`text-secondary ${payslip === "payrun" && "selected"}`} onClick={() => setPayslip("payrun")}>Payrun</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/payslip`}>
                    <div className={`text-secondary ${payslip === "slip" && "selected"}`} onClick={() => setPayslip("slip")}>Slip</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/address`}>
                    <div className={`text-secondary ${payslip === "address" && "selected"}`} onClick={() => setPayslip("address")}>Address</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/contact`}>
                    <div className={`text-secondary ${payslip === "contact" && "selected"}`} onClick={() => setPayslip("contact")}>Contact</div>
                </NavLink>
                <NavLink to={`/${whoIs}/job-desk/social`}>
                    <div className={`text-secondary ${payslip === "social" && "selected"}`} onClick={() => setPayslip("social")}>Social</div>
                </NavLink>
            </div>

            {/* Outlet to render the matched nested route */}
            <Outlet />
        </>
    );
}
