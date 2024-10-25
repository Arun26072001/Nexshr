import React, {useState, useContext } from "react"
import { Outlet } from "react-router-dom";
import "./ParentStyle.css";
import { createContext } from "react";
import { EssentialValues } from "../App";
import Sidebar from "./payslip/layout/Sidebar";
import Navbar from "./payslip/layout/Navbar";


export const WorkTimeTrackerContext = createContext(null);

const Parent = () => {
    const { handleLogout } = useContext(EssentialValues);
    const [isAction, setIsAction] = useState(false);
    const [sideBar, setSideBar] = useState(false);
    const currentDate = new Date();
    const today = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

       const handleActions = () => {
        setIsAction(!isAction);
    };

    function handleSideBar() {
        setSideBar(!sideBar)
    }
    
    // useEffect(() => {
    //     // debugger;
    //     console.log(getDataAPI());
    //     setWorkTimeTracker(getDataAPI())
    // }, [])

    // useEffect(() => {
    //     const account = localStorage.getItem("Account");
    //     if (account == 1) {
    //         setHowIs("/admin")
    //     } else if (account == 2) {
    //         setHowIs("/hr")
    //     } else if (account == 3) {
    //         setHowIs("/emp")
    //     }
    // }, [])
    return (
        <div>
            <Navbar />
            <div className="d-flex marTop">
                <Sidebar handleLogout={handleLogout} />
                <div className="navContent">
                    <Outlet />
                </div>
            </div>
        </div>
    )
};

export default Parent;
