import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import "./payslip.css";
import NavModelRouter from './NavModelRouter';

export default function PayslipRouter({ whoIs, files }) {

    return (
        <>
            <NavModelRouter whoIs={whoIs} files={files} />
            {/* Outlet to render the matched nested route */}
            <Outlet />
        </>
    );
}
