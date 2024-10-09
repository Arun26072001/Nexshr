import React, { useEffect, useState, useRef } from 'react';
import Countdown, { zeroPad } from 'react-countdown';
import { addDataAPI, getDataAPI, updateDataAPI, removeClockinsData } from "./ReuseableAPI";
import { toast } from 'react-toastify';
import "./ClockInsStyle.css";
import CustomDropdown from './CustomDropDown';
import PunchIn from "../asserts/PunchIn.svg";
import PunchOut from "../asserts/punchOut.svg";

const ClockIns = ({ updateClockins, handleLogout }) => {
    const clockinsId = localStorage.getItem('clockinsId');
    const [timeOption, setTimeOption] = useState(localStorage.getItem("timeOption") || "login");
    const EmpName = localStorage.getItem("Name")
    const [loginTime, setLoginTime] = useState(localStorage.getItem("loginTime") || "00:00");
    const [logoutTime, setLogoutTime] = useState(localStorage.getItem("logoutTime") || "00:00");
    const [punchInMsg, setPunchInMsg] = useState(localStorage.getItem("punchInMsg") || "Waiting for Login...");
    const currentDate = new Date();
    const currentHours = currentDate.getHours().toString().padStart(2, '0');
    const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    const startAndEndTime = {
        startingTime: '00:00',
        endingTime: '00:00',
        takenTime: 0,
        timeHolder: 0,
    };
    const [workTimeTracker, setWorkTimeTracker] = useState({
        date: currentDate.toISOString().split("T")[0],
        login: {
            startingTime: '00:00',
            endingTime: '00:00',
            takenTime: 0,
            timeHolder: 0,
            // givenTime: 0
        },
        meeting: {
            startingTime: '00:00',
            endingTime: '00:00',
            takenTime: 0,
            timeHolder: 0,
            // givenTime: 0
        },
        morningBreak: {
            startingTime: '00:00',
            endingTime: '00:00',
            takenTime: 0,
            timeHolder: 0,
            // givenTime: 0
        },
        lunch: { ...startAndEndTime },
        eveningBreak: { ...startAndEndTime },
        event: { ...startAndEndTime }
    });

    const [endTime, setEndTime] = useState(localStorage.getItem('countdownEndTime') && localStorage.getItem("timeOption") === timeOption ? parseInt(localStorage.getItem('countdownEndTime')) : null);
    const [isPaused, setIsPaused] = useState(localStorage.getItem("isPaused") === "false" ? false : true); // return from localStorage is string, change to boolean. 
    const [ranTime, setRanTime] = useState(0);
    const countdownApi = useRef(null);

    // useEffect(() => {
    //     if (endTime && localStorage.getItem("isPaused") === "false") {
    //         countdownApi.current.start();
    //     }
    // }, [endTime]);

    useEffect(() => {
        if (!isPaused && endTime) {
            const interval = setInterval(() => {
                setRanTime((prevTime) => prevTime + 1000);
            }, 1000);

            return () => {
                clearInterval(interval);
                setRanTime(0);
            };
        }
    }, [isPaused]);

    const startCountdown = async () => {
        countdownApi.current.start();
        localStorage.setItem('countdownEndTime', endTime);
        localStorage.setItem('isPaused', false);
        localStorage.setItem("timeOption", timeOption);
        setIsPaused(false);
    };

    const stopCountdown = async () => {
        await countdownApi.current.pause();
        // const timeHolderValue = Date.now() > endTime ? Date.now() - endTime : endTime - Date.now();
        if (Date.now() > endTime) {
            localStorage.setItem("countdownEndTime", endTime)
        }
        localStorage.setItem("countdownEndTime", endTime)
        localStorage.setItem('isPaused', true);
        setIsPaused(true);
    };

    const startTimer = async () => {
        toast.success(`${timeOption} timer has been started!`);
        // login time will set. when select login and punchIn
        if (timeOption === "login" && loginTime === "00:00") {
            const time = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            console.log(time);
            setLoginTime(time);
            localStorage.setItem("loginTime", time);
        }

        if (isPaused) {
            let updateState;
            setWorkTimeTracker((prevState) => (
                updateState = {
                    ...prevState,
                    [timeOption]: {
                        ...prevState[timeOption],
                        startingTime: currentTime
                    }
                }));
            await startCountdown();

            // Call addDataAPI() if clockinsId is not present
            if (!clockinsId) {
                const msgData = await addDataAPI(updateState);
                localStorage.setItem("punchInMsg", msgData);
                setPunchInMsg(msgData);
                updateClockins();
            }
            else {
                const updatedState = (prev) => ({
                    ...prev,
                    [timeOption]: {
                        ...prev[timeOption],
                        startingTime: currentTime
                    },
                });

                // Call the API with the updated state
                updateDataAPI(updatedState(workTimeTracker));
                await updateDataAPI(updateState)
            }
        }
    };

    const stopTimer = async () => {
        toast.error("Timer has been stopped!");
        await stopCountdown();

        if (timeOption === "login") {
            const time = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            setLogoutTime(time);
            localStorage.setItem("logoutTime", time);
        }
        const timeHolderValue = Date.now() > endTime ? Date.now() - endTime : endTime - Date.now();

        const updatedState = (prev) => ({
            ...prev,
            [timeOption]: {
                ...prev[timeOption],
                endingTime: currentTime,
                timeHolder: Math.abs(timeHolderValue),
                takenTime: ranTime,
            },
        });

        // console.log(updatedState);
        // Call the API with the updated state
        await updateDataAPI(updatedState(workTimeTracker));
        updateClockins()
    };


    const updateWorkTracker = async (value) => {
        setTimeOption(value);
        if (clockinsId) {
            const timeData = await getDataAPI(clockinsId);
            console.log(timeData);
            setWorkTimeTracker(timeData);
        }
        // resetTimer()
    };

    const renderer = ({ hours, minutes, seconds, completed }) => {
        if (completed) {
            return <span>Time's up!</span>;
        } else {
            return (
                <span>
                    {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
                </span>
            );
        }
    };

    //get state data from DB in Initially
    useEffect(() => {
        const getClockInsData = async () => {
            // debugger;
            if (clockinsId) {
                const { timeData } = await getDataAPI(clockinsId);
                if (currentDate.toISOString().split("T")[0] === timeData.date.split("T")[0]) {
                    setWorkTimeTracker(timeData);
                } else {
                    if (currentDate.toISOString().split("T")[0] !== timeData.date.split("T")[0]) {
                        handleLogout();
                    }
                }
            }
        }
        getClockInsData()

    }, []);


    // when state or timeOption is change time will update.
    useEffect(() => {
        if (isPaused) {
            if (timeOption === "login") {
                if (workTimeTracker[timeOption] && workTimeTracker[timeOption].timeHolder !== 0) {
                    setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
                } else {
                    if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
                        setEndTime(Date.now() + 1000 * 60 * 60 * 8)
                    }
                }

            } else if (timeOption === "meeting") {
                if (workTimeTracker[timeOption] && workTimeTracker[timeOption] && workTimeTracker[timeOption].timeHolder !== 0) {
                    setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
                } else {
                    if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
                        setEndTime(Date.now() + 1000 * 60 * 60)
                    }
                }
            } else if (timeOption === "morningBreak") {
                if (workTimeTracker[timeOption] && workTimeTracker[timeOption] && workTimeTracker[timeOption].timeHolder !== 0) {
                    setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
                } else {
                    if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
                        setEndTime(Date.now() + 1000 * 60 * 10)
                    }
                }
            } else if (timeOption === "lunch") {
                if (workTimeTracker[timeOption] && workTimeTracker[timeOption].timeHolder !== 0) {
                    setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
                } else {
                    if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
                        setEndTime(Date.now() + 1000 * 60 * 40)
                    }
                }
            } else if (timeOption === "eveningBreak") {
                if (workTimeTracker[timeOption] && workTimeTracker[timeOption].timeHolder !== 0) {
                    setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
                } else {
                    if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
                        setEndTime(Date.now() + 1000 * 60 * 10)
                    }
                }
            } else if (timeOption === "event") {
                if (workTimeTracker[timeOption] && workTimeTracker[timeOption].timeHolder !== 0) {
                    setEndTime(Date.now() + workTimeTracker[timeOption].timeHolder)
                } else {
                    if (!endTime || localStorage.getItem("timeOption") !== timeOption) {
                        setEndTime(Date.now() + 1000 * 60 * 60 * 4)
                    }
                }
            }
        }
    }, [timeOption, workTimeTracker]);

    return (
        <>
            <div className="clockins" >
                <div className='payslipTitle'>
                    Dashboard
                </div>

                {/* <div className="leaveCircle"> */}
                <CustomDropdown isPaused={isPaused} timeOption={timeOption} updateWorkTracker={updateWorkTracker} />
                {/* </div> */}

            </div>
            <div className='good container-fluid row mx-auto'>
                <div className="col-lg-4 col-md-4 col-12">
                    <div><h6>Good to see you, {EmpName[0].toUpperCase() + EmpName.slice(1, EmpName.length)}👋</h6></div>
                    {
                        // clockinsId && timeOption === "login" &&
                        <div className='sub_text'>{punchInMsg}</div>
                    }
                </div>
                <div className="timer col-lg-4 col-md-4 col-12 mx-auto mx-sm-0">
                    <Countdown
                        key={endTime}
                        date={endTime}
                        renderer={renderer}
                        autoStart={!isPaused}
                        ref={countdownApi}
                    />
                </div>
                <div className='leaveIndicator col-sm-12 col-md-4 col-lg-4 mx-auto mx-sm-0'>
                    <div className='d-flex'>
                        <div className="punchBtnParent">
                            <div className='punchBtn' onClick={startTimer} style={{ backgroundColor: "#CEE5D3" }}>
                                <img src={PunchIn} alt="" />
                            </div>
                            <div className="">
                                <div className='timerText'>{loginTime}</div>
                                <div className='sub_text'>Punch In</div>
                            </div>
                        </div>
                        <div className="punchBtnParent">
                            <button className='punchBtn' onClick={stopTimer} disabled={isPaused} style={{ backgroundColor: "#FFD6DB" }}>
                                <img src={PunchOut} alt="" />
                            </button>

                            <div className="">
                                <p className='timerText'>{logoutTime}</p>
                                <p className='sub_text'>Punch Out</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default ClockIns;
