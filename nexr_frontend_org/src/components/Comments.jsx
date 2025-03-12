import React, { useContext, useEffect, useState } from 'react';
import "./Comments.css";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { EssentialValues } from '../App';
import { toast } from 'react-toastify';
import Loading from './Loader';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { getTimeToHour } from './ReuseableAPI';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import profile from "../imgs/male_avatar.webp";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';

export default function Comments() {
    const [isLoading, setIsLoading] = useState(false);
    const [taskObj, setTaskObj] = useState({});
    const { id } = useParams();
    const { data } = useContext(EssentialValues);
    const url = process.env.REACT_APP_API_URL;

    useEffect(() => {
        async function fetchTaskOfComments() {
            setIsLoading(true);
            try {
                const res = await axios.get(`${url}/api/task/${id}`, {
                    params: {
                        withComments: true
                    },
                    headers: { Authorization: data.token || "" }
                })
                console.log(res.data);

                setTaskObj(res.data);
            } catch (error) {
                toast.error(error.response.data.error)
            }
            setIsLoading(false);
        }
        if (id) {
            fetchTaskOfComments()
        }
    }, [])
    return (
        isLoading ? <Loading /> :
            <div className='commentsParent'>
                <div className="comments">
                    <div className="d-flex justify-content-between row">
                        <div className="col-lg-1">
                            <span className='timeBox'>
                                <TimerOutlinedIcon /> {getTimeToHour(taskObj?.spend?.timeHolder)}
                            </span>
                        </div>

                        <div className="col-lg-8 my-3">
                            <div className="commentsHeader mb-3">
                                <input type='checkbox' />
                                {taskObj.title}
                            </div>
                            <div className='text-left'>
                                <p><b>Assigned to</b> {
                                    taskObj?.assignedTo?.map((emp) => {
                                        return (
                                            <>
                                                <img src={profile} className='userProfile' />
                                                {emp.FirstName[0].toUpperCase() + emp.FirstName.slice(1) + " " + emp.LastName}
                                            </>)
                                    })
                                } </p>
                                <p><b>Due On</b> <CalendarMonthRoundedIcon />{new Date(taskObj.to).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="col-lg-1">
                            <span className='circleEditIcon'>
                                <MoreHorizOutlinedIcon fontSize='large' />
                            </span>
                        </div>
                    </div>

                </div>
            </div >

    );
}
