import React, { useEffect, useState, useRef, useContext } from "react";
import "./ClockInsStyle.css";
import CustomDropdown from "./CustomDropDown";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import { TimerStates } from "./payslip/HRMDashboard";
import { toast } from "react-toastify";
import WavingHandRoundedIcon from '@mui/icons-material/WavingHandRounded';
import { Modal, Button } from "rsuite";
import { EssentialValues } from "../App";
import Loading from "./Loader";

const ActivityTimeTracker = () => {
    const {
        startActivityTimer,
        stopActivityTimer,
        workTimeTracker,
        isStartActivity,
        timeOption,
        trackTimer,
        changeReasonForLate,
        isworkingActivityTimerApi
    } = useContext(TimerStates);
    const { data, socket } = useContext(EssentialValues);
    const [isDisabled, setIsDisabled] = useState(false);
    const EmpName = data.Name;
    const [isViewTakeTime, setIsTaketime] = useState(localStorage.getItem("isViewTakeTime") ? true : false);

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
            timerRef.current = setInterval(incrementTime, 1000);
            if (["morningBreak", "eveningBreak", "lunch"].includes(timeOption)) {
                socket.emit("send_notification", {
                    employee: data._id,
                    timerId: workTimeTracker._id,
                    timeOption,
                    time: timeOption === "lunch" ? 30 : 15,
                    token: data.token
                })
            }
        }
    };


    // Stop the timer with activity
    const stopTimer = async () => {
        if (timerRef.current) {
            await stopActivityTimer();
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    function changeViewReasonForTaketime() {
        if (!isViewTakeTime) {
            localStorage.setItem("isViewTakeTime", true)
        }
        setIsTaketime(!isViewTakeTime)
    }
    // Display warning if no punch-in
    const warnPunchIn = () => {
        toast.warning("Please Punch In!")
    };

    function checkIsEnterReasonforLate() {
        changeViewReasonForTaketime();
        localStorage.removeItem("isViewTakeTime");
        stopTimer();
    }

    useEffect(() => {
        socket.connect();
        socket.on("Ask_reason_for_late", (data) => {
            changeViewReasonForTaketime()
        })
    }, [socket])

    // Manage timer state based on startingTime and endingTime
    useEffect(() => {
        const startLength = workTimeTracker?.[timeOption]?.startingTime?.length || 0;
        const endLength = workTimeTracker?.[timeOption]?.endingTime?.length || 0;

        if (startLength !== endLength) {
            setIsDisabled(true)
            startOnlyTimer();
        } else {
            setIsDisabled(false);
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

    const formattedName = EmpName
        ? EmpName.charAt(0).toUpperCase() + EmpName.slice(1)
        : '';

    return (
        <>
            {
                isViewTakeTime &&
                <Modal open={isViewTakeTime} size="sm" backdrop="static">
                    <Modal.Header >
                        <Modal.Title>
                            {timeOption[0].toUpperCase() + timeOption.slice(1)} Reason For Late
                        </Modal.Title>
                    </Modal.Header >

                    <Modal.Body>
                        <div className="modelInput">
                            <p>{timeOption[0].toUpperCase() + timeOption.slice(1)} Reason For Late</p>
                            <input
                                className='form-control'
                                type="text"
                                name={`reasonForLate`}
                                value={workTimeTracker[timeOption]?.reasonForLate}
                                onChange={(e) => changeReasonForLate(e)}
                                placeholder={`Please enter late reason`}
                            />
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            onClick={checkIsEnterReasonforLate}
                            appearance="primary"
                            disabled={workTimeTracker[timeOption].reasonForLate ? false : true}
                        >
                            Add
                        </Button>
                    </Modal.Footer>
                </Modal >
            }
            <div className="clockins">
                <span className='payslipTitle'>Dashboard</span>
                <CustomDropdown isDisabled={isDisabled} />
            </div>
            <div className='good flex-wrap justify-content-between'>
                <div className="col-lg-4 col-md-4 col-12">
                    {/* <p style={{ fontSize: "15px", fontWeight: "600" }}>Good to see you, {EmpName[0]?.toUpperCase() + EmpName?.slice(1)} <WavingHandRoundedIcon sx={{color: "#FCC737"}} /></p> */}
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                        Good to see you,
                        {formattedName}
                        <WavingHandRoundedIcon style={{ color: '#FCC737', marginLeft: '4px' }} />
                    </span>
                    <div className='sub_text'>
                        {workTimeTracker?.punchInMsg || "Waiting for Login"}
                    </div>
                </div>
                <div className="col-lg-6 col-md-4 col-12 d-flex justify-content-end gap-2 align-items-center">

                    <div className={`timer text-light ${isDisabled ? "bg-success" : "bg-danger"}`}>
                        <span>{hour.toString().padStart(2, '0')}</span> :
                        <span>{min.toString().padStart(2, '0')}</span> :
                        <span>{sec.toString().padStart(2, '0')}</span>
                    </div>
                    <div className='leaveIndicator'>
                        <button
                            className={`btn btn-outline-${isDisabled ? "success" : "danger"}`}
                            style={{ padding: "15px 15px" }}
                            title={isStartActivity ? "Stop" : "Start"}
                            onClick={
                                workTimeTracker?._id
                                    ? (isDisabled
                                        ? stopTimer
                                        : (!isDisabled
                                            ? startTimer
                                            : warnPunchIn))
                                    : warnPunchIn
                            }
                            id="startActivityTimerBtn"
                        >
                            {
                                isworkingActivityTimerApi ? <Loading size={20} color='white' /> :
                                    <PowerSettingsNewRoundedIcon />
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActivityTimeTracker;
