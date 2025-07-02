/* eslint-disable no-restricted-globals */
import React, { useState, useContext, useEffect, Suspense } from "react"
import { Outlet } from "react-router-dom";
import "./ParentStyle.css";
import { createContext } from "react";
import { EssentialValues } from "../../../App";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Loading from "../../Loader";
import { Notification, toaster } from "rsuite";
import companyLogo from "../../../imgs/webnexs_logo.webp";

export const WorkTimeTrackerContext = createContext(null);

const Parent = () => {
    const { handleLogout, isStartLogin, isLogin } = useContext(EssentialValues);
    const [isMobileView, setIsMobileView] = useState(false);

    function handlechangeMobileView() {
        setIsMobileView(!isMobileView)
    }

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 450) {
                setIsMobileView(true)
            } else {
                setIsMobileView(false)
            }
        };

        window.addEventListener("resize", handleResize);

        // Cleanup function to remove the event listener
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!isStartLogin && isLogin) {
            toaster.push(
                <Notification
                    header={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img src={companyLogo} alt="Company Logo" style={{ width: 50, height: 50, marginRight: 10 }} />
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Webnexs</span>
                        </div>
                    }
                    closable
                >
                    <strong className="text-danger">Important notice</strong>
                    <p className="my-1">We won't allow to start timer, until select work location</p>
                    <p className="my-1"> The timer will stop when you close the tab or browser.</p>
                </Notification>,
                { placement: 'topCenter' }
            );
        }
    }, [])

    return (
        <div>
            <Navbar handleSideBar={handlechangeMobileView} />
            <div className="d-flex marTop">
                <Sidebar handleSideBar={handlechangeMobileView} setIsMobileView={setIsMobileView} isMobileView={isMobileView} />
                <div className="navContent" style={{width: `calc(100% - ${isMobileView ? "40":"250"}px)`}}>
                    <Suspense fallback={<Loading height="80vh" />}>
                        <Outlet />
                    </Suspense>
                </div>
            </div>
        </div>
    )
};

export default Parent;
