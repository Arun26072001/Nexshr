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
    const { setIsStartActivity } = useContext(EssentialValues);
    const EmpName = localStorage.getItem("Name") || "Employee";
    // Timer states
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[2]) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[1]) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[0]) || 0);
    const timerRef = useRef(null);
    const lastCheckTimeRef = useRef(Date.now());
    // console.log(isStartActivity);


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

    // start and stop timer only
    function stopOnlyTimer() {

        if (timerRef.current && isStartActivity) {
            // setIsStartActivity(false);
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    function startOnlyTimer() {
        // console.log("call timer only fun: ", workTimeTracker._id, isStartActivity);
        // console.log(isStartActivity);

        if (!timerRef.current) {
            // setIsStartActivity(true);
            if (isStartActivity) {
                timerRef.current = setInterval(incrementTime, 1000);
            }
        }
    }

    // Function to start the timer
    const startTimer = async () => {
        // console.log("call to start in startTimer");

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

    const syncTimerAfterPause = () => {
        console.log("call to start in sync");
        console.log(isStartActivity);


        const now = Date.now();
        const diff = now - lastCheckTimeRef.current;
        console.log("Wakeup called.");
        console.log("Time difference since last check (ms):", diff);

        if (diff > 3000 && isStartActivity && workTimeTracker._id) {
            const secondsToAdd = Math.floor(diff / 1000);
            console.log("Seconds to add:", secondsToAdd);

            const updatedTime = addSecondsToTime(`${parseInt(localStorage.getItem("activityTimer")?.split(":")[0])}:${parseInt(localStorage.getItem("activityTimer")?.split(":")[1])}:${parseInt(localStorage.getItem("activityTimer")?.split(":")[2])}`, secondsToAdd);
            console.log("Updated time:", updatedTime);

            // Combine updates into a single state update
            setHour(Number(updatedTime.hours));
            setMin(Number(updatedTime.minutes));
            setSec(Number(updatedTime.seconds));
        }

        startOnlyTimer();
        lastCheckTimeRef.current = now; // Reset last check time
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
            console.log(isStartActivity);

            if (!document.hidden) {
                syncTimerAfterPause();
            } else {
                stopOnlyTimer();
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
            const [newHour, newMin, newSec] = workTimeTracker[timeOption].timeHolder
                .split(":")
                .map(Number);
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
