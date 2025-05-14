import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import "../payslip/payslip.css";
import NavModelRouter from '../payslip/NavModelRouter';

export default function PayslipRouter({ files }) {

    return (
        <>
            <NavModelRouter files={files} />
            {/* Outlet to render the matched nested route */}
            <Outlet />
        </>
    );
}
