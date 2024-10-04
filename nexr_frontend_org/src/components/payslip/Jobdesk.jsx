import React, { useState } from "react"
import Attendence from "./Attendence";
import Leave from "./Leave";
import Folder from "./Folder";
import Assets from "./Assets";
import Payrun from "./Payrun";
import Payslip from "./Payslip";
import Address from "./Address";
import Contact from "./Contact";
import Social from "./Social";
import History from "./History";
import Salary from "./Salary";
import { Route, Routes } from "react-router-dom";
import PayslipRouter from "./PayslipRouter";


const JobDesk = ({whoIs}) => {

    return (

        <Routes >
            <Route path="/" element={<PayslipRouter whoIs={whoIs} />}>
                <Route index element={<Attendence />} />
                <Route path="leave" element={<Leave />} />
                <Route path="folder" element={<Folder />} />
                <Route path="history" element={<History />} />
                <Route path="salary" element={<Salary />} />
                <Route path="payrun" element={<Payrun />} />
                <Route path="payslip" element={<Payslip />} />
                <Route path="contact" element={<Contact />} />
                <Route path="salary" element={<Salary />} />
                <Route path="social" element={<Social />} />
                <Route path="assets" element={<Assets />} />
                <Route path="address" element={<Address />} />
                <Route path="*" element={<h1>404</h1>} />
            </Route>
        </Routes>


    )
};

export default JobDesk;
