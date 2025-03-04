import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { EssentialValues } from '../App';
import { Checkbox } from 'rsuite';
import profile from "../imgs/male_avatar.webp";
import { toast } from 'react-toastify';
import Loading from './Loader';

export default function TimeLog() {
    const navigate = useNavigate();
    const [taskObj, setTaskObj] = useState([]);
    const { id } = useParams();
    const { data } = useContext(EssentialValues);
    const url = process.env.REACT_APP_API_URL;
    const [isLoading, setIsLoading] = useState(false);

    function getMonthFullNameNdDate(date) {
        const fullMonthName = new Date(date)?.toLocaleString("default", { month: "short" });
        const dateValue = new Date(date)?.getDate();
        return dateValue + " " + fullMonthName;
    }

    useEffect(() => {
        async function fetchTaskOfTimeLogs() {
            setIsLoading(true);
            try {
                const res = await axios.get(`${url}/api/task/${id}`, {
                    headers: { Authorization: data.token || "" }
                })
                setTaskObj(res.data);
            } catch (error) {
                toast.error(error.response.data.error)
            }
            setIsLoading(false);
        }
        if (id) {
            fetchTaskOfTimeLogs()
        }
    }, [])

    return (
        <>
            <p className="sub_title mb-3">
                History of Changes
            </p>

            {
                isLoading ? <Loading /> :
                    <div className="row gap-3 mb-5">
                        <div className="col-lg-3">
                            <div className="box-content">
                                <p className='dateTimeTxt'>
                                    From: {`${getMonthFullNameNdDate(taskObj.from)} - ${getMonthFullNameNdDate(taskObj.to)}`}
                                </p>
                                <div className="d-flex align-items-center">
                                    <Checkbox />
                                    <b>
                                        {taskObj.title}
                                    </b>
                                </div>
                                <img src={profile} width={25} height={25} alt="profile" style={{ marginLeft: "7px" }} />
                                <span className='mx-1' style={{ fontSize: "12px" }}>
                                    {taskObj?.createdby?.FirstName[0].toUpperCase() + taskObj?.createdby?.FirstName.slice(1) + " " + taskObj?.createdby?.LastName}
                                </span>
                            </div>
                        </div>
                        <div className="col-lg-8">
                            {
                                taskObj?.tracker?.length === 1 ?
                                    taskObj?.tracker?.map((change) => {
                                        return <div className='position-relative' key={change} >
                                            <span className='dot'></span>
                                            <div class="timeline-item">
                                                <span class="timeline-time dateTimeTxt">{getMonthFullNameNdDate(change.date)}, {`${new Date(change.date).getFullYear()}`} at {`${new Date(change.date).getHours()}:${String(new Date(change.date).getMinutes()).padStart(2, "0")}`}</span>
                                                <p style={{ fontWeight: 600 }}>{change.message}</p>
                                            </div>
                                        </div>
                                    }) :
                                    taskObj?.tracker?.map((change, index) => {
                                        if (index === (taskObj?.tracker?.length - 1)) {
                                            return <div className='position-relative' >
                                                <span className='dot'></span>
                                                <div class="timeline-item">
                                                    <span class="timeline-time dateTimeTxt">{getMonthFullNameNdDate(change.date)}, {`${new Date(change.date).getFullYear()}`} at {`${new Date(change.date).getHours()}:${String(new Date(change.date).getMinutes()).padStart(2, "0")}`}</span>
                                                    <p style={{ fontWeight: 600 }}>{change.message}</p>
                                                </div>
                                            </div>
                                        }
                                        return <div class="timeline">
                                            <span className='dot'></span>
                                            <div class="timeline-item">
                                                <span class="timeline-time dateTimeTxt">{getMonthFullNameNdDate(change.date)}, {`${new Date(change.date).getFullYear()}`} at {`${new Date(change.date).getHours()}:${String(new Date(change.date).getMinutes()).padStart(2, "0")}`}</span>
                                                <p style={{ fontWeight: 600 }}>{change.message}</p>
                                            </div>
                                        </div>
                                    })
                            }
                        </div>
                        <div className="btnBackground">
                            <div className="fixedPositionBtns">
                                <div className="w-50">
                                    <button type="button" className="outline-btn mx-2" onClick={() => navigate(-1)} >
                                        Cancel
                                    </button>
                                </div>
                                <div className="w-50">
                                    <button type="submit" className="button" style={{ padding: "12px" }} >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
            }
        </>
    )
}
