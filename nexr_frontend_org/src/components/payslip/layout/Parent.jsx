/* eslint-disable no-restricted-globals */
import React, { useState, useContext, useEffect } from "react"
import { Outlet } from "react-router-dom";
import "./ParentStyle.css";
import { createContext } from "react";
import { EssentialValues } from "../../../App";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export const WorkTimeTrackerContext = createContext(null);

const Parent = () => {
    const { handleLogout } = useContext(EssentialValues);
    const [sideBar, setSideBar] = useState(screen.width > 1000 ? true : false);
    // const currentDate = new Date();
    // const today = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

    function handleSideBar() {
        setSideBar(!sideBar)
    }

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1000) {
                setSideBar(true)
            } else {
                setSideBar(false)
            }
        };

        window.addEventListener("resize", handleResize);

        // Cleanup function to remove the event listener
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div>
            <Navbar handleSideBar={handleSideBar} />
            <div className="d-flex marTop">
                <Sidebar handleLogout={handleLogout} handleSideBar={handleSideBar} sideBar={sideBar} />
                <div className="navContent">
                    <Outlet />
                </div>
            </div>
        </div>
    )
};

export default Parent;
