import React, { useState, useRef, useEffect } from 'react';

export default function StopWatchTimer() {
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("sec")) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("min")) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("hour")) || 0);
    const intervalRef = useRef(null);  // Use ref to store interval ID
    const [isTimerStarted, setIsTimerStarted] = useState(() => localStorage.getItem("isStarted") === 'true');
    
    function setTime() {
        setSec((prevSec) => {
            if (prevSec >= 59) {
                setMin((prevMin) => {
                    if (prevMin >= 59) {
                        setHour((prevHour) => {
                            const newHour = prevHour + 1;
                            localStorage.setItem("hour", newHour);  // Save hour to localStorage
                            return newHour;
                        });
                        localStorage.setItem("min", 0);  // Reset minutes to 0 in localStorage
                        return 0;
                    }
                    const newMin = prevMin + 1;
                    localStorage.setItem("min", newMin);  // Save minutes to localStorage
                    return newMin;
                });
                localStorage.setItem("sec", 0);  // Reset seconds to 0 in localStorage
                return 0;
            }
            const newSec = prevSec + 1;
            localStorage.setItem("sec", newSec);  // Save seconds to localStorage
            return newSec;
        });
    }

    function startTimer() {
        if (!intervalRef.current) {
            setIsTimerStarted(true); // Prevent multiple intervals
            localStorage.setItem('isStarted', true);
            intervalRef.current = setInterval(setTime, 1000);  // Start the timer
        }
    }

    function stopTimer() {
        if (intervalRef.current) {
            setIsTimerStarted(false); // Prevent multiple intervals
            localStorage.setItem('isStarted', false);
            clearInterval(intervalRef.current);  // Stop the timer
            intervalRef.current = null;  // Reset the reference
        }
    }

    useEffect(() => {
        if (isTimerStarted) {
            startTimer();
        }
        // Cleanup interval when component unmounts
        return () => stopTimer();
    }, [isTimerStarted]);  // Ensure the effect re-runs if isTimerStarted changes

    return (
        <div className='col-lg-4 d-flex align-items-center justify-content-between'>
            <div className='d-flex align-items-center gap-1' >
                <span className='timer'>{hour.toString().padStart(2, '0')}</span> :
                <span className='timer'>{min.toString().padStart(2, '0')}</span> :
                <span className='timer'>{sec.toString().padStart(2, '0')}</span>
            </div>
            <button className='button m-0' onClick={startTimer}>Start</button>
            <button className='button m-0' onClick={stopTimer}>Stop</button>
        </div>
    );
}
