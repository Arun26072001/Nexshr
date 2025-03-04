import React from 'react';
import { useStopwatch, useTimer } from 'react-timer-hook';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

export default function MyTimer({ taskId, updateTask, startingHour = 0, startingMin = 0, startingSec = 0 }) {
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
    } = useStopwatch({ autoStart: false });

    function timeToHour(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(":").map(Number);
        return Number((hours + minutes / 60 + seconds / 3600).toFixed(3)); // Defaults to 0 if input is invalid
    }

    const alterHour = hours + startingHour;
    const alterMin = minutes + startingMin;
    const alterSec = seconds + startingSec;

    function stopTimer() {
        const timeValue = timeToHour(`${alterHour.toString().padStart(2, '0')}:${alterMin.toString().padStart(2, '0')}:${alterSec.toString().padStart(2, '0')}`);
        updateTask(taskId, timeValue);
        pause();
    }

    return (
        <div className='d-flex align-items-center gap-1 timerTxt box-content position-relative' style={{ padding: "10px" }} >
            <span>{`${alterHour}`.toString().padStart(2, '0')}</span> :
            <span>{`${alterMin}`.toString().padStart(2, '0')}</span> :
            <span>{`${alterSec}`.toString().padStart(2, '0')}</span>
            <span className="timeController" style={isRunning ? { background: "rgb(255, 214, 219)", color: "red" } : { background: "rgb(206, 229, 211)", color: "green" }} onClick={() => isRunning ? stopTimer() : start()}>
                {isRunning ? <PauseRoundedIcon sx={{ margin: "0px" }} /> : <PlayArrowRoundedIcon sx={{ margin: "0px" }} />}
            </span>
        </div>
    )
}
