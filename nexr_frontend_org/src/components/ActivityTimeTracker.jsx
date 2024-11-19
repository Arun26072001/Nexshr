import React, { useEffect, useState, useRef, useContext } from "react";
import "./ClockInsStyle.css";
import CustomDropdown from "./CustomDropDown";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import { TimerStates } from "./payslip/HRMDashboard";
import { toast } from "react-toastify";

const ActivityTimeTracker = () => {
    const { startActivityTimer, stopActivityTimer, workTimeTracker, isStartActivity, timeOption } = useContext(TimerStates);
    const EmpName = localStorage.getItem("Name") || "Employee";

    // Timer states
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[2]) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[1]) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[0]) || 0);
    const timerRef = useRef(null);
    const lastCheckTimeRef = useRef(Date.now());

    // Timer logic to increment time
    const incrementTime = () => {
        setSec((prevSec) => {
            let newSec = prevSec + 1;

            if (newSec > 59) {
                newSec = 0;
                setMin((prevMin) => {
                    let newMin = prevMin + 1;
                    if (newMin > 59) {
                        newMin = 0;
                        setHour((prevHour) => (prevHour + 1) % 24); // Wrap hours at 24
                    }
                    return newMin;
                });
            }
            return newSec;
        });
    };

    // Function to update time after inactivity
    const syncTimerAfterPause = () => {
        const now = Date.now();
        const diff = now - lastCheckTimeRef.current;

        if (diff > 3000 && isStartActivity) {
            const secondsToAdd = Math.floor(diff / 1000);
            const updatedTime = addSecondsToTime(`${hour}:${min}:${sec}`, secondsToAdd);
            setHour(Number(updatedTime.hours));
            setMin(Number(updatedTime.minutes));
            setSec(Number(updatedTime.seconds));
        }

        lastCheckTimeRef.current = now; // Reset last check time
    };

    // Function to start the timer
    const startTimer = async () => {
        if (!timerRef.current) {
            await startActivityTimer();
            if (isStartActivity) {
                timerRef.current = setInterval(incrementTime, 1000);
            }
        }
    };

    // Function to stop the timer
    const stopTimer = async () => {
        if (timerRef.current && isStartActivity) {
            await stopActivityTimer();
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Add seconds to a given time
    const addSecondsToTime = (timeString, secondsToAdd) => {
        const [hours, minutes, seconds] = timeString.split(":").map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds + secondsToAdd;

        const newHours = Math.floor(totalSeconds / 3600) % 24;
        const newMinutes = Math.floor((totalSeconds % 3600) / 60);
        const newSeconds = totalSeconds % 60;

        return {
            hours: String(newHours).padStart(2, "0"),
            minutes: String(newMinutes).padStart(2, "0"),
            seconds: String(newSeconds).padStart(2, "0"),
        };
    };

    // Display warning if no punch-in
    const warnPunchIn = () => toast.warning("Please Punch In!");

    // Start/Stop timer based on activity state
    useEffect(() => {
        if (isStartActivity) {
            startTimer();
        } else {
            stopTimer();
        }
        return () => stopTimer(); // Cleanup on unmount
    }, [isStartActivity]);

    // Sync timer with inactivity
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                syncTimerAfterPause();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // Sync state with localStorage
    useEffect(() => {
        localStorage.setItem("activityTimer", `${hour}:${min}:${sec}`);
    }, [hour, min, sec]);

    // Initialize timer with workTimeTracker
    useEffect(() => {
        if (!isStartActivity && workTimeTracker?.[timeOption]?.timeHolder) {
            const [newHour, newMin, newSec] = workTimeTracker[timeOption].timeHolder.split(":").map(Number);
            setHour(newHour);
            setMin(newMin);
            setSec(newSec);
        }
    }, [timeOption, workTimeTracker, isStartActivity]);

    return (
        <>
            <div className="clockins">
                <div className='payslipTitle'>Dashboard</div>
                <CustomDropdown />
            </div>
            <div className='good container-fluid row mx-auto'>
                <div className="col-lg-6 col-md-4 col-12">
                    <div><h6>Good to see you, {EmpName[0].toUpperCase() + EmpName.slice(1)} 👋</h6></div>
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
                            style={{ padding: "10px 15px" }}
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
