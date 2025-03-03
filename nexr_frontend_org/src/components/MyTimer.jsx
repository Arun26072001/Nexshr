import React from 'react';
import { useTimer } from 'react-timer-hook';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

export default function MyTimer({startingHour = 0, startingMin = 0, startingSec = 0}) {
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
    } = useTimer({ autoStart: false, onExpire: () => console.warn('onExpire called') });

    const alterHour = hours + startingHour;
    const alterMin = minutes + startingMin;
    const alterSec = seconds + startingSec;
    

    return (
        <div className='d-flex align-items-center gap-1 timerTxt box-content position-relative' style={{ padding: "10px" }} >
            <span>{`${alterHour}`.toString().padStart(2, '0')}</span> :
            <span>{`${alterMin}`.toString().padStart(2, '0')}</span> :
            <span>{`${alterSec}`.toString().padStart(2, '0')}</span>
            <span className="timeController" style={isRunning ? { background: "rgb(255, 214, 219)", color: "red" } : { background: "rgb(206, 229, 211)", color: "green" }} onClick={() => isRunning ? pause() : start()}>
                {isRunning ? <PauseRoundedIcon sx={{ margin: "0px" }} /> : <PlayArrowRoundedIcon sx={{ margin: "0px" }} />}
            </span>
        </div>
    )
}
