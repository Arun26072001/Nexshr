import React, { useEffect, useState, useRef, useContext } from "react";
import "./ClockInsStyle.css";
import CustomDropdown from "./CustomDropDown";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import { TimerStates } from "./payslip/HRMDashboard";
import { toast } from "react-toastify";
import { addSecondsToTime } from "./ReuseableAPI";
import { EssentialValues } from "../App";

const ActivityTimeTracker = () => {
    const { startActivityTimer, stopActivityTimer, workTimeTracker, isStartActivity, timeOption } = useContext(TimerStates);
    const { setIsStartActivity, data } = useContext(EssentialValues);
    const { Name } = data;
    // Timer states
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[2]) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[1]) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[0]) || 0);
    const timerRef = useRef(null);
    const lastCheckTimeRef = useRef(Date.now());

    // Increment time logic
    const incrementTime = () => {
        lastCheckTimeRef.current += 1000
        setSec((prevSec) => {
            if (prevSec === 59) {
                setMin((prevMin) => {
                    if (prevMin === 59) {
                        setHour((prevHour) => (prevHour + 1) % 24); // Wrap at 24 hours
                        return 0;
                    }
                    return prevMin + 1;
                });
                return 0;
            }
            return prevSec + 1;
        });
    };

    // Start timer
    const startOnlyTimer = () => {
        if (isStartActivity && !timerRef.current) {
            timerRef.current = setInterval(incrementTime, 1000);
        }
    };

    // Stop timer
    const stopOnlyTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Start timer with backend sync
    const startTimer = async () => {
        if (!timerRef.current) {
            await startActivityTimer(); // Backend API call
            startOnlyTimer();
        }
    };

    // Stop timer with backend sync
    const stopTimer = async () => {
        if (timerRef.current) {
            await stopActivityTimer(); // Backend API call
            stopOnlyTimer();
        }
    };

    // Sync timer after inactivity
    const syncTimerAfterPause = () => {
        const now = Date.now();
        const diff = now - lastCheckTimeRef.current;

        if (diff > 3000) {
            const secondsToAdd = Math.floor(diff / 1000);
            const updatedTime = addSecondsToTime(`${parseInt(localStorage.getItem("activityTimer")?.split(':')[0])}:${parseInt(localStorage.getItem("activityTimer")?.split(':')[1])}:${parseInt(localStorage.getItem("activityTimer")?.split(':')[2])}`, secondsToAdd);
            console.log("Updated time:", updatedTime);
            // Combine updates into a single state update
            setHour(Number(updatedTime.hours));
            setMin(Number(updatedTime.minutes));
            setSec(Number(updatedTime.seconds));
        }

        startOnlyTimer();
        lastCheckTimeRef.current = now;
    };

    // Visibility change handler
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (isStartActivity) {
                if (document.hidden) {
                    stopOnlyTimer();
                } else {
                    syncTimerAfterPause();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // Start/stop timer based on `isStartActivity`
    useEffect(() => {
        if (isStartActivity) {
            startTimer();
        } else {
            stopTimer();
        }

        return () => stopOnlyTimer(); // Cleanup on unmount
    }, [isStartActivity]);

    // Sync state with localStorage
    useEffect(() => {
        localStorage.setItem("activityTimer", `${hour}:${min}:${sec}`);
    }, [hour, min, sec]);

    // Initialize timer with workTimeTracker
    useEffect(() => {
        if (!isStartActivity && workTimeTracker?.[timeOption]?.timeHolder) {
            const [newHour, newMin, newSec] = workTimeTracker[timeOption].timeHolder
                .split(":")
                .map(Number);
            setHour(newHour);
            setMin(newMin);
            setSec(newSec);
        }
    }, [timeOption, workTimeTracker, isStartActivity]);

    // Display warning if no punch-in
    const warnPunchIn = () => toast.warning("Please Punch In!");

    return (
        <>
            <div className="clockins">
                <div className='payslipTitle'>Dashboard</div>
                <CustomDropdown />
            </div>
            <div className='good container-fluid row mx-auto'>
                <div className="col-lg-6 col-md-4 col-12">
                    <div><h6>Good to see you, {Name[0]?.toUpperCase() + Name?.slice(1)} 👋</h6></div>
                    <div className='sub_text'>
                        {workTimeTracker?.punchInMsg || "Waiting for Login"}
                    </div>
                </div>
                <div className="col-lg-6 d-flex justify-content-end gap-2 align-items-center">
                    <div className={`timer text-light ${isStartActivity ? "bg-success" : "bg-danger"}`}>
                        <span>{hour.toString().padStart(2, '0')}</span> :
                        <span>{min.toString().padStart(2, '0')}</span> :
                        <span>{sec.toString().padStart(2, '0')}</span>
                    </div>
                    <div className='leaveIndicator'>
                        <button
                            className={`btn btn-outline-${isStartActivity ? "success" : "danger"}`}
                            style={{ padding: "15px 15px" }}
                            title={isStartActivity ? "Stop" : "Start"}
                            onClick={workTimeTracker?._id ? (isStartActivity ? stopTimer : startTimer) : (warnPunchIn)}
                            id="startActivityTimerBtn"
                        >
                            <PowerSettingsNewRoundedIcon />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActivityTimeTracker;
