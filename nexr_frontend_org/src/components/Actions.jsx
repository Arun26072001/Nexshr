import React from "react";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import MasksOutlinedIcon from '@mui/icons-material/MasksOutlined';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import EventSeatOutlinedIcon from '@mui/icons-material/EventSeatOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import MoreTimeOutlinedIcon from '@mui/icons-material/MoreTimeOutlined';
import AvTimerOutlinedIcon from '@mui/icons-material/AvTimerOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';

const Actions = ({ handleActions }) => {
    return (
        <div className="sideToggle">
            <span className="led mx-3">ADD TIME OFF</span>
            <span className="sticky-icon" onClick={handleActions}><CloseRoundedIcon fontSize="large" className="icon" /></span>
            <ul className="list-unstyled sideList">
                <li><WbSunnyOutlinedIcon fontSize="large" className="icon" /> Add annual leave</li>
                <li><MasksOutlinedIcon fontSize="large" className="icon" /> Add sickness</li>
                <li><WatchLaterOutlinedIcon fontSize="large" className="icon" /> Add lateness</li>
                <li><EventSeatOutlinedIcon fontSize="large" className="icon" /> Add other absence</li>
            </ul>

            <span className="led mx-3">HR DOCUMENTS</span>
            <ul className="list-unstyled sideList">
                <li><DateRangeOutlinedIcon fontSize="large" className="icon" /> Request an appinment</li>
            </ul>

            <span className="led mx-3">OVERTIME</span>
            <ul className="list-unstyled sideList">
                <li><MoreTimeOutlinedIcon fontSize="large" className="icon" /> Log overtime</li>
                <li><AvTimerOutlinedIcon fontSize="large" className="icon" /> Use TOIL balance</li>
            </ul>

            <span className="led mx-3">EMPLOYEE & TEAM</span>
            <ul className="list-unstyled sideList">
                <li><PersonOutlineOutlinedIcon fontSize="large" className="icon" /> Add employees</li>
                <li><GroupsOutlinedIcon fontSize="large" className="icon" /> Manage teams</li>
                <li><WorkOutlineOutlinedIcon fontSize="large" className="icon" /> Add jobs</li>
            </ul>
        </div>
    )
};

export default Actions;
