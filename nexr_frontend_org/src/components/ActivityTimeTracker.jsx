import React, { useEffect, useState, useRef, useContext } from "react";
import "./ClockInsStyle.css";
import CustomDropdown from "./CustomDropDown";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import { TimerStates } from "./payslip/HRMDashboard";
import { toast } from "react-toastify";
import { addSecondsToTime } from "./ReuseableAPI";

const ActivityTimeTracker = () => {
    const {
        startActivityTimer,
        stopActivityTimer,
        workTimeTracker,
        isStartActivity,
        timeOption,
        trackTimer
    } = useContext(TimerStates);

    const EmpName = localStorage.getItem("Name") || "Employee";

    const [sec, setSec] = useState(
        Number(workTimeTracker?.[timeOption]?.timeHolder?.split(':')[2] || 0)
    );
    const [min, setMin] = useState(
        Number(workTimeTracker?.[timeOption]?.timeHolder?.split(':')[1] || 0)
    );
    const [hour, setHour] = useState(
        Number(workTimeTracker?.[timeOption]?.timeHolder?.split(':')[0] || 0)
    );

    const timerRef = useRef(null);

    // Timer increment logic
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

    // Start the timer
    const startOnlyTimer = () => {
        if (!timerRef.current) {
            timerRef.current = setInterval(incrementTime, 1000);
        }
    };


    // Stop the timer
    const stopOnlyTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Start the timer with activity
    const startTimer = async () => {
        if (!timerRef.current) {
            await startActivityTimer();
            trackTimer()
            // if (isStartLogin) {
            timerRef.current = setInterval(incrementTime, 1000);
            // }
        }
    };

    // Stop the timer with activity
    const stopTimer = async () => {
        console.log("try to stop");
        
        if (timerRef.current) {
            await stopActivityTimer();
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Display warning if no punch-in
    const warnPunchIn = () => {
        toast.warning("Please Punch In!")
    };


    // Manage timer state based on startingTime and endingTime
    useEffect(() => {
        const startLength = workTimeTracker?.[timeOption]?.startingTime?.length || 0;
        const endLength = workTimeTracker?.[timeOption]?.endingTime?.length || 0;

        if (startLength !== endLength) {
            startOnlyTimer();
        } else {
            stopOnlyTimer();
        }

        return () => stopOnlyTimer(); // Cleanup on unmount
    }, [workTimeTracker, timeOption, isStartActivity]);

    // Sync state with workTimeTracker
    useEffect(() => {
        if (workTimeTracker?.[timeOption]?.timeHolder) {
            const [newHour, newMin, newSec] = workTimeTracker[timeOption].timeHolder
                .split(":")
                .map(Number);
            setHour(newHour);
            setMin(newMin);
            setSec(newSec);
        }
    }, [timeOption, workTimeTracker]);

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
                            onClick={
                                workTimeTracker?._id
                                    ? (isStartActivity
                                        ? stopTimer
                                        : (workTimeTracker?.[timeOption]?.startingTime?.length === workTimeTracker?.[timeOption]?.endingTime?.length
                                            ? startTimer
                                            : warnPunchIn))
                                    : null
                            }
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
