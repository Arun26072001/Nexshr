import React, { useEffect, useState, useRef, useContext } from 'react';
import "./ClockInsStyle.css";
import CustomDropdown from './CustomDropDown';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import { TimerStates } from './payslip/HRMDashboard';

const ClockIns = () => {
    const {startActivityTimer, stopActivityTimer,workTimeTracker, updateWorkTracker } = useContext(TimerStates)
    // const empId = localStorage.getItem("_id");
    const [timeOption, setTimeOption] = useState(localStorage.getItem("timeOption") || "meeting");
    const EmpName = localStorage.getItem("Name")
    // const currentDate = new Date();
    // const currentHours = currentDate.getHours().toString().padStart(2, '0');
    // const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
    const [isPaused, setIsPaused] = useState(localStorage.getItem("isPaused") === "false" ? false : true); // return from localStorage is string, change to boolean. 
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("timer")?.split(":")[2]) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("timer")?.split(":")[1]) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("timer")?.split(":")[0]) || 0);
    const otherTimerRef = useRef(null);
    const [isTimerStarted, setIsTimerStarted] = useState(false);

    function setTime() {
        setSec((prevSec) => {
            let newSec = prevSec + 1;
            let newMin = null;
            let newHour = null;

            if (newSec > 59) {
                newSec = 0;  // Reset seconds to 0
                setMin((prevMin) => {
                    newMin = prevMin + 1;

                    if (newMin > 59) {
                        newMin = 0;  // Reset minutes to 0
                        setHour((prevHour) => {
                            newHour = prevHour + 1;
                            localStorage.setItem("activityTimer", `${newHour}:${newMin}:${newSec}`);
                            return newHour;
                        });
                    } else {
                        localStorage.setItem("activityTimer", `${newHour !== null ? newHour : localStorage.getItem("hour")}:${newMin}:${newSec}`);
                    }
                    return newMin;
                });
            } else {
                newHour = hour || 0;
                newMin = min || 0;
                localStorage.setItem("activityTimer", `${newHour}:${newMin}:${newSec}`);
            }

            return newSec;
        });
    }

    function startIt() {
        if (!otherTimerRef.current) {
            setIsTimerStarted(true); // Prevent multiple intervals
            localStorage.setItem('isStarted', true);
            otherTimerRef.current = setInterval(setTime, 1000);  // Start the timer
            startActivityTimer();
        }
    }

    function stopIt() {
        if (otherTimerRef.current) {
            setIsTimerStarted(false); // Prevent multiple intervals
            localStorage.setItem('isStarted', false);
            clearInterval(otherTimerRef.current);  // Stop the timer
            otherTimerRef.current = null;  // Reset the reference
            stopActivityTimer();
        }
    }

    useEffect(() => {
        if (isTimerStarted) {
            startIt();
        }
        // Cleanup interval when component unmounts
        return () => stopIt();
    }, [isTimerStarted]); 
    
    return (
        <>
            <div className="clockins" >
                <div className='payslipTitle'>
                    Dashboard
                </div>
                <CustomDropdown isPaused={isPaused} timeOption={timeOption} updateWorkTracker={updateWorkTracker} />

            </div>
            <div className='good container-fluid row mx-auto'>
                <div className="col-lg-6 col-md-4 col-12">
                    <div><h6>Good to see you, {EmpName[0].toUpperCase() + EmpName.slice(1)}👋</h6></div>
                    {
                        <div className='sub_text'>{workTimeTracker?.punchInMsg ? workTimeTracker.punchInMsg : "Waiting for Login"}</div>
                    }
                </div>
                <div className="col-lg-6 d-flex justify-content-end gap-2 align-items-center">
                    <div className={`timer text-light ${isPaused ? "bg-success" : "bg-danger"}`}>
                        {/* <Countdown
                            key={endTime}
                            date={endTime}
                            renderer={renderer}
                            autoStart={!isPaused}
                            ref={countdownApi}
                        /> */}
                        <span>{hour.toString().padStart(2, '0')}</span> :
                        <span>{min.toString().padStart(2, '0')}</span> :
                        <span>{sec.toString().padStart(2, '0')}</span>
                    </div>
                    <div className='leaveIndicator'>
                        <button class={`btn btn-outline-${isPaused ? "success" : "danger"}`} style={{ padding: "10px 15px" }} onClick={isPaused ? startIt : stopIt} id="startActivityTimerBtn">
                            <PowerSettingsNewRoundedIcon />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClockIns;
// import Countdown, { zeroPad } from 'react-countdown';
// import { addDataAPI, getDataAPI, removeClockinsData, updateDataAPI } from "./ReuseableAPI";
// import { toast } from 'react-toastify';
// const [punchInMsg, setPunchInMsg] = useState(localStorage.getItem("punchInMsg") || "Waiting for Login...");
// const [endTime, setEndTime] = useState(localStorage.getItem('countdownEndTime') && localStorage.getItem("timeOption") === timeOption ? parseInt(localStorage.getItem('countdownEndTime')) : null);
// const clockinsId = localStorage.getItem('clockinsId');
// const [loginTime, setLoginTime] = useState(localStorage.getItem("loginTime") || "00:00");
        // const [logoutTime, setLogoutTime] = useState(localStorage.getItem("logoutTime") || "00:00");
        // const startAndEndTime = {
        //     startingTime: "00:00",
        //     endingTime: "00:00",
        //     takenTime: 0,
        //     timeHolder: 0,
        // };
    
        // const [workTimeTracker, setWorkTimeTracker] = useState({
        //     date: new Date(),
        //     login: { ...startAndEndTime },
        //     meeting: { ...startAndEndTime },
        //     morningBreak: { ...startAndEndTime },
        //     lunch: { ...startAndEndTime },
        //     eveningBreak: { ...startAndEndTime },
        //     event: { ...startAndEndTime }
        // });
    
        // to get timeHolder value
        // useEffect(() => {
        //     if (!isPaused && endTime) {
        //         const interval = setInterval(() => {
        //             setRanTime((prevTime) => prevTime + 1000);
        //             localStorage.setItem("timer", `${hour+":"+min+":"+sec}`)
        //         }, 1000);
    
        //         return () => {
        //             clearInterval(interval);
        //             setRanTime(0);
        //         };
        //     }
        // }, [isPaused]);
    
        // const startCountdown = async () => {
        //     countdownApi.current.start();
        //     localStorage.setItem('countdownEndTime', endTime);
        //     localStorage.setItem("timeOption", timeOption);
        //     localStorage.setItem('isPaused', false);
        //     setIsPaused(false);
        //     toast.success("Timer has been started!");
        // };
    
        // const startActivityTimer = async () => {
        //     const updatedState = {
        //         ...workTimeTracker,
        //         [timeOption]: {
        //             ...workTimeTracker[timeOption],
        //             startingTime: workTimeTracker[timeOption].startingTime !== "00:00" ? workTimeTracker[timeOption].startingTime : currentTime
        //         },
        //     };
    
        //     // Check if clockinsId is present
        //     if (!workTimeTracker?._id) {
        //         try {
        //             const clockinsData = await addDataAPI(updatedState);  // Assuming updateState is some required data for addDataAPI
        //             setWorkTimeTracker(clockinsData);
        //             updateClockins();
        //         } catch (error) {
        //             console.error('Error in starting timer:', error);
        //         }
        //     } else {
        //         if (workTimeTracker?._id && !isPaused) {
        //             toast.warning("Timer has been already started!")
        //         }
        //         try {
        //             // Call the API with the updated state
        //             await updateDataAPI(updatedState);
        //             setWorkTimeTracker(updatedState)
        //         } catch (error) {
        //             console.error('Error updating data:', error);
        //             toast.error('Failed to update the timer. Please try again.');
        //         }
        //     }
        //     await startCountdown();
        //     // Set login time when 'login' is selected and no loginTime is set
        //     // if (timeOption === "login" && loginTime === "00:00") {
        //     //     const time = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        //     //     setLoginTime(time);
        //     //     localStorage.setItem("loginTime", time);
        //     // }
    
        //     // if (isPaused) {
        //     //     // Update state for paused case
        //     //     setWorkTimeTracker((prevState) => ({
        //     //         ...prevState,
        //     //         [timeOption]: {
        //     //             ...prevState[timeOption],
        //     //             startingTime: currentTime
        //     //         }
        //     //     }));
        //     //     // Start the countdown after updating the state
        //     //     await startCountdown();
        //     // }
        //     // toast.success(`${timeOption} timer has been started!`);
        // };
    
        // const stopActivityTimer = async () => {
        //     // if (timeOption === "login") {
        //     //     const time = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        //     //     setLogoutTime(time);
        //     //     localStorage.setItem("logoutTime", time);
        //     // }
        //     const timeHolderValue = Date.now() > endTime ? Date.now() - endTime : endTime - Date.now();
        //     console.log(workTimeTracker);
    
        //     const updatedState = (prev) => ({
        //         ...prev,
        //         [timeOption]: {
        //             ...prev[timeOption],
        //             endingTime: currentTime,
        //             timeHolder: Math.abs(timeHolderValue),
        //             takenTime: ranTime,
        //         },
        //     });
        //     console.log(updatedState(workTimeTracker));
    
    
        //     if (workTimeTracker?._id) {
        //         // Call the API with the updated state
        //         await updateDataAPI(updatedState(workTimeTracker));
        //         localStorage.setItem('isPaused', true);
        //         setIsPaused(true);
        //         await countdownApi.current.pause();
        //         toast.success(`${timeOption} Timer has been stopped!`)
        //         updateClockins();
        //     } else {
        //         localStorage.setItem('isPaused', true);
        //         setIsPaused(true);
        //         await countdownApi.current.pause();
        //         return toast.error("You did't punch-in")
        //     }
        // };
    
        // const updateWorkTracker = async (value) => {
        //     setTimeOption(value);
        // };
    
        //get state data from DB in Initially
        // useEffect(() => {
        //     const getClockInsData = async () => {
        //         try {
        //             if (empId) {
        //                 const { timeData } = await getDataAPI(empId);
        //                 if (timeData?.clockIns[0]?._id) {
        //                     localStorage.setItem("clockinsId", timeData.clockIns[0]._id);
        //                     setWorkTimeTracker(timeData.clockIns[0])
        //                     // console.log(timeData.clockIns[0]);
        //                 } else {
        //                     setWorkTimeTracker({ ...workTimeTracker });
        //                     removeClockinsData();
        //                 }
        //             }
        //         } catch (error) {
        //             console.log(error);
        //         }
        //     }
        //     getClockInsData()
        // }, []);
    
        // when state or timeOption is change time will update.
        // useEffect(() => {
        //     if (isPaused) {
        //         // if (timeOption === "login") {
        //         //     if (workTimeTracker[timeOption]?.timeHolder !== 0) {
        //         //         setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
        //         //     } else {
        //         //         if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
        //         //             setEndTime(Date.now() + 1000 * 60 * 60 * 8)
        //         //         }
        //         //     }
    
        //         // }
        //         if (timeOption === "meeting") {
        //             if (workTimeTracker[timeOption]?.timeHolder !== 0) {
        //                 setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
        //             } else {
        //                 if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
        //                     setEndTime(Date.now() + 1000 * 60 * 60)
        //                 }
        //             }
        //         } else if (timeOption === "morningBreak") {
        //             if (workTimeTracker[timeOption]?.timeHolder !== 0) {
        //                 setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
        //             } else {
        //                 if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
        //                     setEndTime(Date.now() + 1000 * 60 * 10)
        //                 }
        //             }
        //         } else if (timeOption === "lunch") {
        //             if (workTimeTracker[timeOption]?.timeHolder !== 0) {
        //                 setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
        //             } else {
        //                 if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
        //                     setEndTime(Date.now() + 1000 * 60 * 40)
        //                 }
        //             }
        //         } else if (timeOption === "eveningBreak") {
        //             if (workTimeTracker[timeOption]?.timeHolder !== 0) {
        //                 setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
        //             } else {
        //                 if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
        //                     setEndTime(Date.now() + 1000 * 60 * 10)
        //                 }
        //             }
        //         } else if (timeOption === "event") {
        //             if (workTimeTracker[timeOption]?.timeHolder !== 0) {
        //                 setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
        //             } else {
        //                 if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
        //                     setEndTime(Date.now() + 1000 * 60 * 60 * 4)
        //                 }
        //             }
        //         }
        //     }
        // }, [timeOption, workTimeTracker]);
