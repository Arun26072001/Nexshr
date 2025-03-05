import React, { useRef, useState } from 'react';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

export default function Mytimer2({ startTaskTimer, stopTaskTimer, task }) {
    const timerRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);
    const [sec, setSec] = useState(
        // Number(workTimeTracker?.[timeOption]?.timeHolder?.split(':')[2] || 
        0
        // )
    );
    const [min, setMin] = useState(
        // Number(workTimeTracker?.[timeOption]?.timeHolder?.split(':')[1] || 
        0
        // )
    );
    const [hour, setHour] = useState(
        // Number(workTimeTracker?.[timeOption]?.timeHolder?.split(':')[0] || 
        0
        // )
    );


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
    // Start the timer with activity
    const startTimer = async () => {
        if (!timerRef.current) {
            await startTaskTimer();
            timerRef.current = setInterval(incrementTime, 1000);
        }
    };


    // Stop the timer with activity
    const stopTimer = async () => {
        if (timerRef.current) {
            await stopTaskTimer();
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    return (
        <div className='d-flex align-items-center gap-1 timerTxt box-content position-relative' style={{ padding: "10px" }} >
            <span>{`${hour}`.toString().padStart(2, '0')}</span> :
            <span>{`${min}`.toString().padStart(2, '0')}</span> :
            <span>{`${sec}`.toString().padStart(2, '0')}</span>
            <span className={`timeController ${task.status === "Completed" ? "d-none" : ""}`} style={isRunning ? { background: "rgb(255, 214, 219)", color: "red" } : { background: "rgb(206, 229, 211)", color: "green" }} onClick={() => isRunning ? stopTimer() : startTimer()}>
                {isRunning ? <PauseRoundedIcon sx={{ margin: "0px" }} /> : <PlayArrowRoundedIcon sx={{ margin: "0px" }} />}
            </span>
        </div>
    )
}
