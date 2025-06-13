import React, { useContext, useEffect, useRef, useState } from 'react';
import './navbar.css';
import Webnexs from "../../../imgs/webnexs_logo.webp";
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import PunchIn from "../../../asserts/PunchIn.svg";
import PunchOut from "../../../asserts/punchOut.svg";
import { TimerStates } from '../HRMDashboard';
import { Accordion, Button, DatePicker, Dropdown, Input, Modal, Popover, SelectPicker, Whisper } from 'rsuite';
import logo from "../../../imgs/male_avatar.webp";
import { EssentialValues } from '../../../App';
import axios from "axios";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import Loading from '../../Loader';
import { convertTimeStringToDate, processActivityDurations, updateDataAPI } from '../../ReuseableAPI';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ handleSideBar }) {
    const { handleLogout, data, handleUpdateAnnouncements, isChangeAnnouncements, whoIs,
        changeViewReasonForEarlyLogout, isViewEarlyLogout, setIsStartLogin } = useContext(EssentialValues)
    const { startLoginTimer, stopLoginTimer, workTimeTracker, isStartLogin,
        trackTimer, changeReasonForEarly, setWorkTimeTracker, isWorkingLoginTimerApi,
        setIsWorkingLoginTimerApi, isForgetToPunchOut } = useContext(TimerStates);
    const [sec, setSec] = useState(workTimeTracker?.login?.timeHolder?.split(':')[2])
    const [min, setMin] = useState(workTimeTracker?.login?.timeHolder?.split(':')[1])
    const [hour, setHour] = useState(workTimeTracker?.login?.timeHolder?.split(':')[0])
    const [isDisabled, setIsDisabled] = useState(false);
    const workRef = useRef(null);  // Use ref to store interval ID
    const url = process.env.REACT_APP_API_URL;
    const [notifications, setNotifications] = useState([]);
    const [isRemove, setIsRemove] = useState([]);
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [workLocation, setWorklocation] = useState(localStorage.getItem("workLocation") || "");
    const worklocationType = ["WFH", "WFO"].map((item) => ({ label: item, value: item }))

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
        if (workRef.current && isStartLogin) {
            clearInterval(workRef.current);
            workRef.current = null;
        }
    }

    function startOnlyTimer() {
        if (!workRef.current) {
            workRef.current = setInterval(incrementTime, 1000);
        }
    }

    // Function to start the timer
    const startTimer = async () => {
        if (!workRef.current) {
            await startLoginTimer(workLocation, { latitude, longitude });
            if (isStartLogin) {
                workRef.current = setInterval(incrementTime, 1000);
            }

        }
    };

    // Function to stop the timer
    const stopTimer = async () => {
        if (workRef.current) {
            await stopLoginTimer(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
            clearInterval(workRef.current);
            workRef.current = null;
        }
    };

    const renderMenu = ({ onClose, right, top, className }, ref) => {
        const handleSelect = eventKey => {
            if (eventKey === 1) {

            } else if (eventKey === 2) {
                handleLogout();
            }
            onClose();
        };
        return (
            <Popover ref={ref} className={className} style={{ right, top }} full>
                <Dropdown.Menu onSelect={handleSelect} title="Personal Settings">
                    <Dropdown.Item><b>Personal Profile</b></Dropdown.Item>
                    {/* <Dropdown.Item eventKey={1}>Profile</Dropdown.Item> */}
                    <Dropdown.Item eventKey={2}>Log out</Dropdown.Item>
                </Dropdown.Menu>
            </Popover>
        );
    };

    async function fetchNotifications() {
        try {
            setIsLoading(true);
            const res = await axios.get(`${url}/api/employee/notifications/${data._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            const totalRemovables = [];
            res.data.forEach((item, index) => {
                totalRemovables.push(false);
            });
            setIsRemove(totalRemovables);
            setNotifications(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch notifications", error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, [isChangeAnnouncements])

    async function checkIsCompletedWorkingHour() {
        const currentTime = new Date().toTimeString().split(' ')[0];
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                endingTime: [...(workTimeTracker?.login?.endingTime || []), currentTime],
                timeHolder: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
            },
        };
        // check user is completed working hour
        try {
            const res = await axios.post(`${url}/verify_completed_workinghour`, updatedState);
            console.log("isCompleted", res.data.isCompleteworkingHours);
            if (!res.data.isCompleteworkingHours) {
                changeViewReasonForEarlyLogout()
            } else {
                stopTimer()
            }
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in check working hour is complated", error);
        }
    }

    async function updateEmpNotifications(updatedValues) {
        try {
            const res = await axios.put(`${url}/api/employee/notifications/${data._id}`, updatedValues, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            console.log("updated notifications", res.data.message);
            handleUpdateAnnouncements();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("Error in update notifications", error);
        }
    }

    async function clearMsgs() {
        try {
            notifications.forEach((item, index) => {
                setIsRemove((pre) => {
                    const updated = [...pre];
                    updated[index] = true;
                    return updated;
                })
            })

            await updateEmpNotifications(notifications); // Await if it's async
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("Error clearing messages:", error);
        }
    }

    async function removeMessage(value, itemIndex) {
        try {
            setIsRemove((prev) => {
                const updated = [...prev];
                updated[itemIndex] = true;
                return updated;
            });

            setTimeout(async () => {
                try {
                    // Update only this notification on the backend
                    await updateEmpNotifications([value]); // Pass only the ID of the notification to update

                } catch (err) {
                    console.log("Error updating notifications:", err);
                    setNotifications(notifications);
                }
            }, 300);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("Error removing message:", error);
        }
    }


    // trigger this function when add reason for early logout
    function checkIsEnterReasonforEarly() {
        changeViewReasonForEarlyLogout()
        localStorage.removeItem("isViewEarlyLogout");
        stopTimer();
    }

    function getAddress() {
        function roundCoord(coord, precision = 4) {
            return parseFloat(coord).toFixed(precision);
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(roundCoord(pos.coords.latitude));
                setLongitude(roundCoord(pos.coords.longitude))
            },
            (err) => console.error(err),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    async function verifyWfh() {
        try {
            const res = await axios.get(`${url}/api/wfh-application/check-wfh/${data._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setWorklocation(res.data ? "WFH" : "WFO")
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in check wfh", error);
        }
    }

    async function clockOut() {
        try {
            setIsWorkingLoginTimerApi(true)
            const updatedState = processActivityDurations(workTimeTracker, "login")
            const updatedData = await updateDataAPI(updatedState);
            setIsStartLogin(false);
            localStorage.setItem("isStartLogin", false)
            // eslint-disable-next-line no-restricted-globals
            location.reload()
        } catch (err) {
            console.error(err);
        } finally {
            setIsWorkingLoginTimerApi(false);
        }
    }

    function removeLastOneNdAddCurrent(actualTime) {
        const updatedLoginEndTime = workTimeTracker.login.endingTime;
        updatedLoginEndTime.pop();
        updatedLoginEndTime.push(actualTime);

        setWorkTimeTracker((pre) => ({
            ...pre,
            "login": {
                ...pre?.login,
                endingTime: updatedLoginEndTime,
            }
        }))
    }

    function updateCheckoutTime(time) {
        const actualTime = new Date(time).toTimeString().split(" ")[0];
        if (workTimeTracker.login.startingTime.length !== workTimeTracker.login.endingTime.length) {
            setWorkTimeTracker((pre) => ({
                ...pre,
                "login": {
                    ...pre?.login,
                    endingTime: [...(workTimeTracker?.login?.endingTime || []), actualTime],
                }
            }))
        } else {
            removeLastOneNdAddCurrent(actualTime)
        }
    }

    useEffect(() => {
        getAddress();
    }, [latitude, longitude])

    useEffect(() => {
        verifyWfh()
    }, [])

    useEffect(() => {
        const startLength = workTimeTracker?.login?.startingTime?.length || 0;
        const endLength = workTimeTracker?.login?.endingTime?.length || 0;
        if (workTimeTracker?._id) { //timer start to allow, if is timer data in obj 
            if (startLength !== endLength) {
                setIsDisabled(true);
                startOnlyTimer();
            } else {
                stopOnlyTimer();
                setIsDisabled(false);
            }
        }
        return () => stopOnlyTimer(); // Cleanup on unmount
    }, [workTimeTracker]);

    // Sync timer with inactivity
    useEffect(() => {
        const handleVisibilityChange = () => {
            trackTimer();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // Initialize time based on selected workTimeTracker and timeOption
    useEffect(() => {
        if (workTimeTracker?.login?.timeHolder) {
            const [newHour, newMin, newSec] = workTimeTracker?.login?.timeHolder?.split(/[:.]+/).map(Number);
            setHour(newHour);
            setMin(newMin);
            setSec(newSec);
        }
    }, [workTimeTracker, isStartLogin]);

    console.log("worktraker", workTimeTracker);

    return (
        isForgetToPunchOut ? <Modal open={isForgetToPunchOut} size="sm" backdrop="static">
            <Modal.Header >
                <Modal.Title>
                    Reason for forget to stop timer
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="modelInput">
                    <p className='modelLabel'>Please Enter the reason</p>
                    <Input size='lg'
                        type='text'
                        autoComplete='off'
                        onChange={(e) => changeReasonForEarly(e, "forgetToLogout")}
                        value={workTimeTracker?.forgetToLogout} />
                </div>
                <div className="modelInput">
                    <p className='modelLabel'>Checkout Time:</p>
                    <DatePicker value={workTimeTracker?.login?.endingTime[workTimeTracker?.login?.startingTime.length - 1] ? convertTimeStringToDate(workTimeTracker?.login?.endingTime?.[workTimeTracker?.login?.startingTime?.length - 1]) : null}
                        size='lg'
                        style={{ width: "100%" }}
                        format="HH:mm:ss"
                        onChange={(e) => updateCheckoutTime(e)} />
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    onClick={clockOut}
                    appearance="primary"
                    disabled={workTimeTracker.forgetToLogout && workTimeTracker?.login?.endingTime?.length === workTimeTracker?.login?.startingTime?.length ? false : true}
                >
                    Add
                </Button>
            </Modal.Footer>
        </Modal > :
            isViewEarlyLogout ?
                <Modal open={isViewEarlyLogout} size="sm" backdrop="static">
                    <Modal.Header >
                        <Modal.Title>
                            Reason for early logout
                        </Modal.Title>
                    </Modal.Header >

                    <Modal.Body>
                        <div className="modelInput">
                            <p>Please Enter reason for early logout</p>
                            <Input size='lg'
                                type='text'
                                autoComplete='off'
                                onChange={(e) => changeReasonForEarly(e, "reasonForEarlyLogout")}
                                value={workTimeTracker?.login?.reasonForEarlyLogout} />
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            onClick={checkIsEnterReasonforEarly}
                            appearance="primary"
                            disabled={workTimeTracker.login.reasonForEarlyLogout ? false : true}
                        >
                            Add
                        </Button>
                    </Modal.Footer>
                </Modal > :
                <div className="webnxs">
                    <div className="row mx-auto justify-content-between" >
                        <div className="col-lg-3 col-md-3 col-6 d-flex align-items-center">
                            <div className={`sidebarIcon`} onClick={handleSideBar}>
                                <TableRowsRoundedIcon />
                            </div>
                            <img
                                src={Webnexs}
                                width={30}
                                height={30}
                                style={{ objectFit: "cover" }}
                                alt="Webnexs Company Logo"
                            />
                            <span style={{ fontSize: "16px", fontWeight: "700" }}>NexHR</span>
                        </div>
                        {
                            whoIs !== "superAdmin" &&
                            <>
                                <div className='col-lg-1 col-md-3  col-6 d-flex align-items-center justify-content-center'>
                                    <div className='d-flex align-items-center gap-1 timerTxt' >
                                        <span>{hour.toString().padStart(2, '0')}</span> :
                                        <span>{min.toString().padStart(2, '0')}</span> :
                                        <span>{sec.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>

                                <div className='col-lg-3 col-md-3 col-12 d-flex align-items-center justify-content-center'>
                                    <div className='d-flex'>
                                        <div className="punchBtnParent">
                                            <button
                                                className='punchBtn'
                                                disabled={isWorkingLoginTimerApi || !workLocation ? true : isDisabled}
                                                onClick={startTimer}
                                                style={{ backgroundColor: "#CEE5D3" }}
                                            >
                                                {
                                                    !isDisabled && isWorkingLoginTimerApi ? <Loading size={20} color="#0a7e22" /> :
                                                        <img src={PunchIn} width="25" height="25" alt="startTimer_btn" />
                                                }
                                            </button>
                                            <div className="">
                                                <p className='timerText'>
                                                    {workTimeTracker?.login?.startingTime.length > 0
                                                        ? workTimeTracker?.login?.startingTime[0]
                                                        : "00:00"}
                                                </p>
                                                <div className='sub_text'>Punch In</div>
                                            </div>
                                        </div>

                                        <div className="punchBtnParent">
                                            <button
                                                className='punchBtn'
                                                onClick={checkIsCompletedWorkingHour}
                                                disabled={isWorkingLoginTimerApi ? true : !isDisabled}
                                                style={{ backgroundColor: "#FFD6DB" }}
                                            >
                                                {
                                                    isDisabled && isWorkingLoginTimerApi ? <Loading size={20} color="#fd314d" /> :
                                                        <img src={PunchOut} width="25" height="25" alt="stoptimer_btn" />
                                                }
                                            </button>
                                            <div className="">
                                                <p className='timerText'>
                                                    {workTimeTracker?.login?.endingTime?.length > 0
                                                        ? workTimeTracker?.login?.endingTime[workTimeTracker?.login?.endingTime.length - 1]
                                                        : "00:00"}
                                                </p>
                                                <p className='sub_text'>Punch Out</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        }

                        <div className='gap-2 col-lg-4 col-md-3 d-flex align-items-center justify-content-end'>
                            <SelectPicker
                                data={worklocationType}
                                searchable={false}
                                onChange={(e) => {
                                    setWorklocation(e)
                                    localStorage.setItem("workLocation", e)
                                }}
                                style={{ width: 200 }}
                                value={workLocation}
                                appearance="default"
                                placeholder="Choose work place"
                            />
                            <span className="bell mx-2 position-relative" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">
                                <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_2046_6896)">
                                        <path d="M4.11584 4.25758C4.28455 2.64323 5.73825 1.5 7.47569 1.5H8.52431C10.2618 1.5 11.7155 2.64323 11.8842 4.25758L12.2348 7.80303C12.3619 9.01954 12.9113 10.2534 13.7994 11.1515C14.2434 11.6005 13.9022 12.5303 13.2477 12.5303H2.75233C2.09777 12.5303 1.75663 11.6005 2.20061 11.1515C3.08866 10.2534 3.63806 9.01954 3.76519 7.80303L4.11584 4.25758Z" stroke="#212143" strokeWidth="1.20741" strokeLinejoin="round" />
                                        <path d="M6.13794 12.5303H9.86207V12.7273C9.86207 13.7063 9.0284 14.5 8.00001 14.5C6.97161 14.5 6.13794 13.7063 6.13794 12.7273V12.5303Z" stroke="#212143" strokeWidth="1.20741" strokeLinejoin="round" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_2046_6896">
                                            <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                {
                                    notifications.length > 0 &&
                                    <span className='messageCount'>
                                        {notifications.length <= 9 ? notifications.length : "9+"}
                                    </span>
                                }
                            </span>
                            {/* Profile Section */}
                            <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
                                <img src={data?.profile || logo} className='imgContainer' style={{ width: "40px", height: "40px" }} alt='emp_img' />
                            </Whisper>
                            {/* Messages Section */}
                            <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
                                <div className="offcanvas-header">
                                    <h5 id="offcanvasRightLabel">Notifications</h5>
                                    <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                                </div>
                                <div className="offcanvas-body">
                                    {
                                        isLoading ? <Loading /> :
                                            notifications.length > 0 &&
                                            notifications.map((notification, index) => {
                                                return <div key={notification._id || index} className={`box-content my-2 ${isRemove[index] ? "remove" : ""} box-content my-2 d-flex justfy-content-center align-items-center position-relative`}>
                                                    <span className="closeBtn" title='close' onClick={() => removeMessage(notification, index)}>
                                                        <CloseRoundedIcon fontSize='md' />
                                                    </span>
                                                    <img src={notification?.company?.logo} alt={"companyLogo"} width={50} height={"auto"} />
                                                    <Accordion>
                                                        <Accordion.Panel header={<p>{notification.title}</p>} eventKey={1} caretAs={KeyboardArrowDownRoundedIcon}>
                                                            <p className='sub_text' style={{ fontSize: "13px" }}>{notification?.message?.replace(/<[^>]*>/g, "")}</p>
                                                        </Accordion.Panel>
                                                    </Accordion>
                                                </div>
                                            })
                                    }
                                </div>
                                <div className='text-align-center m-2' >
                                    <button className='button w-100' onClick={clearMsgs}>Clear all</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
    );
}