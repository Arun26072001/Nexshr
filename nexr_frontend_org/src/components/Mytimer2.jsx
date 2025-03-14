import React, { useEffect, useRef, useState } from 'react';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

export default function Mytimer2({ task, updatedTimerInTask }) {
    const timerRef = useRef(null);
    const [isRunning, setIsRunning] = useState(() => JSON.parse(localStorage.getItem(`isRunning_${task._id}`)) || false);
    const [hour, setHour] = useState(0);
    const [min, setMin] = useState(0);
    const [sec, setSec] = useState(0);
    console.log(task.spend.timeHolder);

    useEffect(() => {
        if (task?.spend?.timeHolder) {
            const [newHour, newMin, newSec] = task.spend.timeHolder.split(":").map(Number);
            setHour(newHour || 0);
            setMin(newMin || 0);
            setSec(newSec || 0);
        }
    }, [task]);

    const incrementTime = () => {
        setSec(prevSec => {
            let newSec = prevSec + 1;
            if (newSec > 59) {
                newSec = 0;
                setMin(prevMin => {
                    let newMin = prevMin + 1;
                    if (newMin > 59) {
                        newMin = 0;
                        setHour(prevHour => (prevHour + 1) % 24);
                    }
                    return newMin;
                });
            }
            return newSec;
        });
    };

    const startTimer = async () => {
        if (!timerRef.current) {
            await updatedTimerInTask(task._id, "startTime");
            timerRef.current = setInterval(incrementTime, 1000);
            setIsRunning(true);
            localStorage.setItem(`isRunning_${task._id}`, true);
        }
    };

    const stopTimer = async () => {
        if (timerRef.current) {
            await updatedTimerInTask(task._id, "stopTime", `${hour}:${min}:${sec}`);
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsRunning(false);
            localStorage.setItem(`isRunning_${task._id}`, false);
        }
    };

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(incrementTime, 1000);
        } else {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning]);

    return (
        <div className='d-flex align-items-center gap-1 timerTxt box-content position-relative' style={{ padding: "10px" }}>
            <span>{String(hour).padStart(2, '0')}</span> :
            <span>{String(min).padStart(2, '0')}</span> :
            <span>{String(sec).padStart(2, '0')}</span>
            <span className={`timeController ${task?.status === "Completed" ? "d-none" : ""}`}
                style={isRunning ? { background: "rgb(255, 214, 219)", color: "red" } : { background: "rgb(206, 229, 211)", color: "green" }}
                onClick={isRunning ? stopTimer : startTimer}>
                {isRunning ? <PauseRoundedIcon sx={{ margin: "0px" }} /> : <PlayArrowRoundedIcon sx={{ margin: "0px" }} />}
            </span>
        </div>
    );
}
