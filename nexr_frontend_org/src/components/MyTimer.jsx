import React from 'react';
import { useStopwatch } from 'react-timer-hook';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

export default function MyTimer({ task, updateTask, startingHour = 0, startingMin = 0, startingSec = 0 }) {
    let calculatedValue = 0;
    function valueCalculation() {
        if (localStorage.getItem(`timer_${task._id}`)) {
            const savedTime = Date.now() - Number(localStorage.getItem(`timer_${task._id}`));
            calculatedValue = (savedTime > 10000 ? savedTime : 0) / 1000;
        }
    }
    valueCalculation();

    const {
        totalSeconds,
        seconds,
        minutes,
        hours,
        days,
        isRunning,
        start,
        pause,
        resume,
        restart,
    } = useStopwatch({ autoStart: localStorage.getItem(`${task._id}`) || false });

    function timeToHour(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(":").map(Number);
        return Number((hours + minutes / 60 + seconds / 3600).toFixed(3)); // Defaults to 0 if input is invalid
    }
    console.log(calculatedValue);

    let alterTotalSeconds;
    if (isRunning) {
        alterTotalSeconds = (calculatedValue + totalSeconds) + (startingHour * 3600) + (startingMin * 60) + startingSec;
    } else {
        alterTotalSeconds = totalSeconds + (startingHour * 3600) + (startingMin * 60) + startingSec;
    }
    const alterHour = Math.floor(alterTotalSeconds / 3600);
    const alterMin = Math.floor((alterTotalSeconds % 3600) / 60);
    const alterSec = alterTotalSeconds % 60;
    if (isRunning) {
        localStorage.setItem(`timer_${task._id}`, Date.now());
    }

    function stopTimer() {
        localStorage.removeItem(task._id)
        const timeValue = timeToHour(`${alterHour.toString().padStart(2, '0')}:${alterMin.toString().padStart(2, '0')}:${alterSec.toString().padStart(2, '0')}`);
        updateTask(task._id, timeValue);
        pause();
    }

    function startTimer() {
        localStorage.setItem(`${task._id}`, true);
        start();
    }

    return (
        <div className='d-flex align-items-center gap-1 timerTxt box-content position-relative' style={{ padding: "10px" }} >
            <span>{`${alterHour}`.toString().padStart(2, '0')}</span> :
            <span>{`${alterMin}`.toString().padStart(2, '0')}</span> :
            <span>{`${alterSec}`.toString().padStart(2, '0')}</span>
            <span className={`timeController ${task.status === "Completed" ? "d-none" : ""}`} style={isRunning ? { background: "rgb(255, 214, 219)", color: "red" } : { background: "rgb(206, 229, 211)", color: "green" }} onClick={() => isRunning ? stopTimer() : startTimer()}>
                {isRunning ? <PauseRoundedIcon sx={{ margin: "0px" }} /> : <PlayArrowRoundedIcon sx={{ margin: "0px" }} />}
            </span>
        </div>
    )
}
