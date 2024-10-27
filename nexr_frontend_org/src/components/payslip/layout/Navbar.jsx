import React, { useContext, useEffect, useRef, useState } from 'react';
import './navbar.css';
import Webnexs from "../../../imgs/webnexs_logo.png";
// import Profile from "../../../imgs/male_avatar.png";
// import MyStopwatch from './StopWatchTimer';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import ProfileImgUploader from '../../ImgUploader';
import PunchIn from "../../../asserts/PunchIn.svg";
import PunchOut from "../../../asserts/punchOut.svg";
import { TimerStates } from '../HRMDashboard';
import { Dropdown, IconButton, Popover, Whisper } from 'rsuite';
import logo from "../../../imgs/male_avatar.png";
import { EssentialValues } from '../../../App';

export default function Navbar() {
    const { handleLogout } = useContext(EssentialValues)
    const { startLoginTimer, stopLoginTimer, workTimeTracker, isStartLogin } = useContext(TimerStates);
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("loginTimer")?.split(':')[2]) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("loginTimer")?.split(':')[1]) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("loginTimer")?.split(':')[0]) || 0);
    const workRef = useRef(null);  // Use ref to store interval ID
    // debugger;

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

    async function startTimer() {
        if (!workRef.current) {
            await startLoginTimer();
            if (isStartLogin) {
                workRef.current = setInterval(setTime, 1000);  // Start the timer
            }
        }
    }

    async function stopTimer() {
        if (workRef.current) {
            await stopLoginTimer();
            if (!isStartLogin) {
                clearInterval(workRef.current);  // Stop the timer
                workRef.current = null;  // Reset the reference
            }
        }
    }

    useEffect(() => {

        if (isStartLogin) {
            console.log("starting login timer");

            startTimer();
        }
        // Cleanup interval when component unmounts
        return () => stopTimer();
    }, [isStartLogin]);  // Ensure the effect re-runs if isTimerStarted changes

    // Assuming sec, min, hour are your state variables
    useEffect(() => {

        // This effect runs every time sec, min, or hour changes
        localStorage.setItem("loginTimer", `${hour}:${min}:${sec}`);
    }, [sec, min, hour]);

    // Initialize time based on selected workTimeTracker and timeOption
    useEffect(() => {
        if (!isStartLogin && workTimeTracker?.login?.timeHolder) {
            const [newHour, newMin, newSec] = workTimeTracker?.login?.timeHolder?.split(":").map(Number);
            setHour(newHour);
            setMin(newMin);
            setSec(newSec);
        }
    }, [workTimeTracker, isStartLogin]);

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
                    <Dropdown.Item eventKey={1}>Profile</Dropdown.Item>
                    <Dropdown.Item eventKey={2}>Log out</Dropdown.Item>
                </Dropdown.Menu>
            </Popover>
        );
    };
    return (
        <div className="webnxs">
            <div className="row mx-auto">
                <div className="col-lg-4 col-md-6 col-4 d-flex align-items-center">
                    <div className='sidebarIcon'>
                        <TableRowsRoundedIcon />
                    </div>
                    <img src={Webnexs} className="logowebnexslogo" />
                    <span style={{ fontSize: "16px", fontWeight: "700" }}>NexHR</span>
                </div>

                <div className='col-lg-4 d-flex align-items-center justify-content-center'>
                    <div className='d-flex align-items-center gap-1 timerTxt' >
                        <span>{hour.toString().padStart(2, '0')}</span> :
                        <span>{min.toString().padStart(2, '0')}</span> :
                        <span>{sec.toString().padStart(2, '0')}</span>
                    </div>
                </div>

                <div className="col-lg-4 col-md-6 col-4 d-flex align-items-center justify-content-between">
                    <div className="punchBtnParent">
                        <button className='punchBtn' disabled={isStartLogin} onClick={() => startTimer()} style={{ backgroundColor: "#CEE5D3" }}>
                            <img src={PunchIn} alt="" />
                        </button>
                        <div className="">
                            <div className='timerText'>{workTimeTracker?.login?.startingTime}</div>
                            <div className='sub_text'>Punch In</div>
                        </div>
                    </div>
                    <div className="punchBtnParent">
                        <button className='punchBtn' onClick={() => stopTimer()} disabled={!isStartLogin} style={{ backgroundColor: "#FFD6DB" }}>
                            <img src={PunchOut} alt="" />
                        </button>

                        <div className="">
                            <p className='timerText'>{workTimeTracker?.login?.endingTime}</p>
                            <p className='sub_text'>Punch Out</p>
                        </div>
                    </div>
                    <div className='gap-1'>
                        <span className="lg ms-5"><svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_2046_6893)">
                                <path d="M14 8C14 11.5899 11.0899 14.5 7.5 14.5M14 8C14 4.41015 11.0899 1.5 7.5 1.5M14 8H1M7.5 14.5C3.91015 14.5 1 11.5899 1 8M7.5 14.5C8.91418 14.5 10.0606 11.5899 10.0606 8C10.0606 4.41015 8.91418 1.5 7.5 1.5M7.5 14.5C6.08582 14.5 4.93939 11.5899 4.93939 8C4.93939 4.41015 6.08582 1.5 7.5 1.5M1 8C1 4.41015 3.91015 1.5 7.5 1.5" stroke="#212143" stroke-width="1.20741" stroke-linejoin="round" />
                            </g>
                            <defs>
                                <clipPath id="clip0_2046_6893">
                                    <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                </clipPath>
                            </defs>
                        </svg>
                        </span>
                        <span className="lang ms-2"><svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.118608 11V0.818182H6.50213V2.14062H1.65483V5.2429H6.16903V6.56037H1.65483V9.67756H6.56179V11H0.118608ZM16.6882 0.818182V11H15.2763L10.1008 3.53267H10.0064V11H8.47016V0.818182H9.89203L15.0724 8.29545H15.1669V0.818182H16.6882Z" fill="#212143" />
                        </svg>
                        </span>
                        <span className="bell ms-3">
                            <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_2046_6896)">
                                    <path d="M4.11584 4.25758C4.28455 2.64323 5.73825 1.5 7.47569 1.5H8.52431C10.2618 1.5 11.7155 2.64323 11.8842 4.25758L12.2348 7.80303C12.3619 9.01954 12.9113 10.2534 13.7994 11.1515C14.2434 11.6005 13.9022 12.5303 13.2477 12.5303H2.75233C2.09777 12.5303 1.75663 11.6005 2.20061 11.1515C3.08866 10.2534 3.63806 9.01954 3.76519 7.80303L4.11584 4.25758Z" stroke="#212143" stroke-width="1.20741" stroke-linejoin="round" />
                                    <path d="M6.13794 12.5303H9.86207V12.7273C9.86207 13.7063 9.0284 14.5 8.00001 14.5C6.97161 14.5 6.13794 13.7063 6.13794 12.7273V12.5303Z" stroke="#212143" stroke-width="1.20741" stroke-linejoin="round" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_2046_6896">
                                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                    </clipPath>
                                </defs>
                            </svg>
                        </span>
                    </div>
                    {/* <img src={Profile} className="avatar ms-3" /> */}
                    {/* <ProfileImgUploader /> */}
                    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
                        <img src={logo} className='avatar-toggle' />
                    </Whisper>
                </div>
            </div>
        </div>
    );
}
