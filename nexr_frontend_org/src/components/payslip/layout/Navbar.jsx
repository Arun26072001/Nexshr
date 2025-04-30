import React, { useContext, useEffect, useRef, useState } from 'react';
import './navbar.css';
import Webnexs from "../../../imgs/webnexs_logo.webp";
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import PunchIn from "../../../asserts/PunchIn.svg";
import PunchOut from "../../../asserts/punchOut.svg";
import { TimerStates } from '../HRMDashboard';
import { Accordion, Button, Dropdown, Input, Modal, Popover, Whisper } from 'rsuite';
import logo from "../../../imgs/male_avatar.webp";
import { EssentialValues } from '../../../App';
import axios from "axios";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import useHandleTabClose from '../../../handleCloseTab';
import Loading from '../../Loader';

export default function Navbar({ handleSideBar }) {
    const { handleLogout, data, handleUpdateAnnouncements, isChangeAnnouncements, whoIs, socket } = useContext(EssentialValues)
    const { startLoginTimer, stopLoginTimer, workTimeTracker, isStartLogin, trackTimer, changeReasonForEarly, isWorkingLoginTimerApi } = useContext(TimerStates);
    const [sec, setSec] = useState(workTimeTracker?.login?.timeHolder?.split(':')[2])
    const [min, setMin] = useState(workTimeTracker?.login?.timeHolder?.split(':')[1])
    const [hour, setHour] = useState(workTimeTracker?.login?.timeHolder?.split(':')[0])
    const [isDisabled, setIsDisabled] = useState(false);
    const workRef = useRef(null);  // Use ref to store interval ID
    const url = process.env.REACT_APP_API_URL;
    const [announcements, setAnnouncements] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isRemove, setIsRemove] = useState([]);
    const [isViewEarlyLogout, setIsViewEarlyLogout] = useState(JSON.parse(localStorage.getItem("isViewEarlyLogout")) ? true : false);
    const [lat, setLat] = useState("");
    const [long, setLong] = useState("");
    const [placeId, setPlaceId] = useState("");
    // const [workLocation, setWorklocation] = useState("");
    // const [placeId, setPlaceId] = useState("");
    // const worklocationType = ["WFH", "WFO"].map((item) => ({ label: item, value: item }))

    console.log("my placeId", placeId);

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
        // console.log("call timer only fun: ", workTimeTracker._id, isStartLogin);
        if (!workRef.current) {
            // if (isStartLogin) {
            workRef.current = setInterval(incrementTime, 1000);
            // }
        }
    }

    // Function to start the timer
    const startTimer = async () => {
        if (!workRef.current) {
            await startLoginTimer();
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

    async function fetchAnnouncements() {
        try {
            const res = await axios.get(`${url}/api/announcements/emp/${data._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            res.data.forEach((item, index) => {
                setIsRemove((pre) => {
                    const updated = [...pre];
                    updated[index] = false;
                    return updated;
                })
            });

            setAnnouncements(res.data);
        } catch (error) {
            setAnnouncements([]);
            // console.log(error.response.data.error);
        }
    }

    async function fetchNotifications() {
        try {
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
            console.log("error in fetch notifications", error);

        }
    }

    useEffect(() => {
        // fetchAnnouncements();
        fetchNotifications();
    }, [isChangeAnnouncements])

    function checkIsCompletedWorkingHour() {
        const currentTime = new Date().toTimeString().split(' ')[0];
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                endingTime: [...(workTimeTracker?.login?.endingTime || []), currentTime],
                timeHolder: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
            },
        };
        socket.emit("verify_completed_workinghour", updatedState);
    }

    async function updateEmpNotifications(updatedValues) {
        try {
            const res = await axios.put(`${url}/api/employee/notifications/${data._id}`, updatedValues, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            console.log("updated notifications", res.data.message);

        } catch (error) {
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
            const viewedNotifications = notifications.map((item) => ({
                ...item,
                isViewed: true,
            }));

            await updateEmpNotifications(viewedNotifications); // Await if it's async
            handleUpdateAnnouncements();
        } catch (error) {
            console.log("Error clearing messages:", error);
        }
    }

    // Call this on tab/browser close or refresh (you can add event listener if needed)

    async function removeMessage(value, index) {
        try {
            setIsRemove((prev) => {
                const updated = [...prev];
                updated[index] = true;
                return updated;
            });

            const updatedNotifications = notifications.map((item) =>
                item.title === value.title
                    ? { ...item, isViewed: true }
                    : item
            );

            setNotifications(updatedNotifications);

            setTimeout(async () => {
                try {
                    await updateEmpNotifications(updatedNotifications); // Await if it's async
                    handleUpdateAnnouncements();
                } catch (err) {
                    console.log("Error updating notifications:", err);
                }
            }, 300);
        } catch (error) {
            console.log("Error removing message:", error);
        }
    }

    useHandleTabClose(isStartLogin, workTimeTracker, data.token);
    function changeViewReasonForEarlyLogout() {
        if (!isViewEarlyLogout) {
            localStorage.setItem("isViewEarlyLogout", true)
        }
        setIsViewEarlyLogout(!isViewEarlyLogout)
    }

    function checkIsEnterReasonforEarly() {
        changeViewReasonForEarlyLogout()
        localStorage.removeItem("isViewEarlyLogout");
        stopTimer();
    }

    // async function getAddress(lat, lng) {
    //     const API_KEY = process.env.REACT_APP_MAPKEY;  // Replace with a secured API key (keep it secret)
    //     const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.toFixed(7)},${lng.toFixed(7)}&result_type=street_address|locality|postal_code&key=${API_KEY}`;

    //     try {
    //         const response = await fetch(url);
    //         const data = await response.json();

    //         if (data.status === "OK" && data.results.length > 0) {
    //             const address = data.results[0].formatted_address;
    //             const placeId = data.results[0].place_id;

    //             console.log("Address:", address);
    //             console.log("Place ID:", placeId);

    //             return { address, placeId };
    //         } else {
    //             console.error("Geocoding failed:", data.status, data.error_message);
    //         }
    //     } catch (error) {
    //         console.error("Error fetching location:", error);
    //     }
    // }

    // useEffect(() => {
    //     if (navigator.geolocation) {
    //         navigator.geolocation.getCurrentPosition(
    //             (position) => {
    //                 const { latitude, longitude } = position.coords;
    //                 getAddress(latitude, longitude);
    //             },
    //             (error) => console.error("Error getting location:", error),
    //             { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    //         );
    //     } else {
    //         console.log("Geolocation is not supported by this browser.");
    //     }

    // }, [placeId])

    function getAddress() {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log(pos.coords.latitude);
                setLat(pos.coords.latitude);
                setLong(pos.coords.longitude)
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );
    }
    getAddress()

    useEffect(() => {
        const getAddressFromCoords = async (lat, lon) => {
            try {
                const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
                    params: {
                        lat,
                        lon,
                        format: "json",
                    },
                });

                if (res.data && res.data.display_name) {
                    console.log(res.data);
                    setPlaceId(res.data.place_id);
                } else {
                    setPlaceId("Address not found.");
                }
            } catch (err) {
                console.error(err);
                setPlaceId("Failed to get address.");
            }
        };
        if (lat && long) {
            console.log(lat, long);
            getAddressFromCoords(lat, long)
        }
    }, [lat, long])

    useEffect(() => {
        socket.connect();
        socket.on("early_logout", ({ isCompleteworkingHours }) => {
            if (isCompleteworkingHours) {
                stopTimer()
            } else {
                changeViewReasonForEarlyLogout()
            }

        })
    }, [socket])

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
            const [newHour, newMin, newSec] = workTimeTracker?.login?.timeHolder?.split(":").map(Number);
            setHour(newHour);
            setMin(newMin);
            setSec(newSec);
        }
    }, [workTimeTracker, isStartLogin]);

    return (
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
                 hstartLoginTimer           style={{ objectFit: "cover" }}
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
                                            disabled={isWorkingLoginTimerApi ? true : isDisabled}
                                            onClick={() => startTimer()}
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
                                            onClick={() => checkIsCompletedWorkingHour()}
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
                                    {notifications?.length}
                                </span>
                            }
                        </span>
                        {/* Profile Section */}
                        <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
                            <img src={data?.profile || logo} className='imgContainer' style={{ width: "40px", height: "40px" }} alt='emp_img' />
                        </Whisper>
                        {/* Messages Section */}
                        <div className="offcanvas offcanvas-end" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
                            <div className="offcanvas-header">
                                <h5 id="offcanvasRightLabel">Notifications</h5>
                                <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                            </div>
                            <div className="offcanvas-body">
                                {
                                    notifications.map((notification, index) => {
                                        return <div key={notification._id} className={`box-content my-2 ${isRemove[index] ? "remove" : ""} box-content my-2 d-flex justfy-content-center align-items-center position-relative`}>
                                            <span className="closeBtn" title='close' onClick={() => removeMessage(notification, index)}>
                                                <CloseRoundedIcon fontSize='md' />
                                            </span>
                                            <img src={notification.company.logo} alt={"companyLogo"} width={50} height={"auto"} />
                                            <Accordion>
                                                <Accordion.Panel header={<p>{notification.title}</p>} eventKey={1} caretAs={KeyboardArrowDownRoundedIcon}>
                                                    <p className='sub_text' style={{ fontSize: "13px" }}>{notification.message.replace(/<[^>]*>/g, "")}</p>
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

// {/* <SelectPicker
// data={worklocationType}
// searchable={false}
// onChange={setWorklocation}
// value={workLocation}

// appearance="default"
// placeholder="Choose your work place"
// /> */}
// {/* <span className="lg ms-5">
// <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <g clipPath="url(#clip0_2046_6893)">
//         <path d="M14 8C14 11.5899 11.0899 14.5 7.5 14.5M14 8C14 4.41015 11.0899 1.5 7.5 1.5M14 8H1M7.5 14.5C3.91015 14.5 1 11.5899 1 8M7.5 14.5C8.91418 14.5 10.0606 11.5899 10.0606 8C10.0606 4.41015 8.91418 1.5 7.5 1.5M7.5 14.5C6.08582 14.5 4.93939 11.5899 4.93939 8C4.93939 4.41015 6.08582 1.5 7.5 1.5M1 8C1 4.41015 3.91015 1.5 7.5 1.5" stroke="#212143" strokeWidth="1.20741" strokeLinejoin="round" />
//     </g>
//     <defs>
//         <clipPath id="clip0_2046_6893">
//             <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
//         </clipPath>
//     </defs>
// </svg>
// </span> */}
// {/* <span className="lang ms-2">
// <svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M0.118608 11V0.818182H6.50213V2.14062H1.65483V5.2429H6.16903V6.56037H1.65483V9.67756H6.56179V11H0.118608ZM16.6882 0.818182V11H15.2763L10.1008 3.53267H10.0064V11H8.47016V0.818182H9.89203L15.0724 8.29545H15.1669V0.818182H16.6882Z" fill="#212143" />
// </svg>
// </span> */}
// get user current location
//  async function getAddress(lat, lng) {
//     const API_KEY = process.env.REACT_APP_MAPKEY;  // Replace with a secured API key (keep it secret)
//     const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.toFixed(7)},${lng.toFixed(7)}&result_type=street_address|locality|postal_code&key=${API_KEY}`;

//     try {
//         const response = await fetch(url);
//         const data = await response.json();

//         if (data.status === "OK" && data.results.length > 0) {
//             const address = data.results[0].formatted_address;
//             const placeId = data.results[0].place_id;

//             console.log("Address:", address);
//             console.log("Place ID:", placeId);

//             return { address, placeId };
//         } else {
//             console.error("Geocoding failed:", data.status, data.error_message);
//         }
//     } catch (error) {
//         console.error("Error fetching location:", error);
//     }
// }

// useEffect(() => {
//     if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//             (position) => {
//                 const { latitude, longitude } = position.coords;
//                 getAddress(latitude, longitude);
//             },
//             (error) => console.error("Error getting location:", error),
//             { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//         );
//     } else {
//         console.log("Geolocation is not supported by this browser.");
//     }

// }, [placeId])