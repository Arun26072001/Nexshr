import React, { useEffect, useState, useRef, useContext } from 'react';
import "./ClockInsStyle.css";
import CustomDropdown from './CustomDropDown';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import { TimerStates } from './payslip/HRMDashboard';
import { toast } from 'react-toastify';

const ClockIns = () => {
    const { startActivityTimer, stopActivityTimer, workTimeTracker, isStartActivity, timeOption } = useContext(TimerStates);
    const EmpName = localStorage.getItem("Name");
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[2]) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[1]) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("activityTimer")?.split(":")[0]) || 0);
    const timerRef = useRef(null);

    // Sync sec, min, hour with localStorage
    useEffect(() => {
        localStorage.setItem("activityTimer", `${hour}:${min}:${sec}`);
    }, [sec, min, hour]);

    // Timer logic to increment time
    function setTime() {
        setSec((prevSec) => {
            let newSec = prevSec + 1;

            if (newSec > 59) {
                newSec = 0;  // Reset seconds to 0
                setMin((prevMin) => {
                    let newMin = prevMin + 1;
                    if (newMin > 59) {
                        newMin = 0;  // Reset minutes to 0
                        setHour((prevHour) => prevHour + 1);
                    }
                    return newMin;
                });
            }
            return newSec;
        });
    }

    // Function to start the timer
    async function startIt() {
        if (!timerRef.current) {
            await startActivityTimer();
            if (isStartActivity) {
                timerRef.current = setInterval(setTime, 1000);  // Start the timer every second
            }
        }
    }

    // Function to stop the timer
    async function stopIt() {
        if (timerRef.current) {
            await stopActivityTimer();
            clearInterval(timerRef.current);  // Stop the timer
            timerRef.current = null;  // Reset the reference
        }
    }

    function plsPunchIn() {
        return toast.warning("Please Punchin!")
    }

    // Start timer when the activity starts
    useEffect(() => {
        if (isStartActivity) {
            startIt();
        }
        // Cleanup interval on component unmount
        return () => {
            stopIt()
        };
    }, [isStartActivity]);

    // Initialize time based on selected workTimeTracker and timeOption
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
                <p className='payslipTitle'>Dashboard</p>
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
                            onClick={workTimeTracker?._id ? (isStartActivity ? stopIt : startIt) : (plsPunchIn)}
                            id="startActivityTimerBtn"
                        >
                            <PowerSettingsNewRoundedIcon />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ClockIns;
