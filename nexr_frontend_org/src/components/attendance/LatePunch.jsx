import React, { useContext, useEffect, useState } from 'react'
import { EssentialValues } from '../../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loading from '../Loader';
import { DateRangePicker, Input } from 'rsuite';
import { Skeleton } from '@mui/material';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { toast } from 'react-toastify';
import LateLoginModal from '../payslip/layout/LateLoginModal';

export default function LatePunch() {
    const url = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const { data } = useContext(EssentialValues);
    const [empName, setEmpName] = useState("");
    const [latePunches, setLatePunches] = useState([]);
    const [lateLoginObj, setLateLoginObj] = useState({});
    const [filteredPunches, setFilteredPunches] = useState([]);
    const [dateRangeValue, setDateRangeValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResponsing, setIsResponsing] = useState(false);
    const [isLateLogin, setIsLateLogin] = useState(false);

    async function responseToLatePunch(item, response) {
        try {
            setIsResponsing(item._id)
            let updatedAttendance;
            updatedAttendance = {
                ...item,
                lateLogin: {
                    ...item.lateLogin,
                    status: response
                }
            }

            const res = await axios.put(`${url}/api/clock-ins/late-punchin-response/${item._id}`, updatedAttendance, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            fetchLatePunch();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in reply to leave", error);
            toast.error(error?.response?.data?.error)
        } finally {
            setIsResponsing("")
        }
    }

    function changeLateLogin() {
        setIsLateLogin(!isLateLogin);
    }
    // add and remove lateLoginObj
    function handleLateLogin(value) {
        if (value) {
            setLateLoginObj(value);
            changeLateLogin();
        } else {
            changeLateLogin();
            setLateLoginObj({});
        }
    }

    async function fetchLatePunch() {
        try {
            setIsLoading(true);
            const res = await axios.get(`${url}/api/clock-ins/late-punch`, {
                params: {
                    dateRangeValue
                },
                headers: {
                    Authorization: data.token
                }
            })
            setLatePunches(res.data);
            setFilteredPunches(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch latePunch", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchLatePunch();
    }, [dateRangeValue])

    useEffect(() => {
        if (empName === "") {
            setLatePunches(filteredPunches);
        } else {
            const filterRequests = filteredPunches?.filter((item) => item.employee.FirstName.toLowerCase().includes(empName.toLowerCase()));
            setLatePunches(filterRequests);
        }
    }, [empName]);

    return (
        isLoading ? <Loading /> :
            <div>
                {/* Top date input and leave label */}
                <div className="leaveDateParent">
                    <p className="payslipTitle">
                        Late Punches
                    </p>
                </div>

                {/* Display leave data or no data found */}
                <div>
                    <div className="leaveContainer d-block">
                        <div className='px-3 my-3'>
                            <div className="d-flex align-items-center justify-content-between">
                                <Input value={empName} size="lg" style={{ width: "300px" }} placeholder="Search Employee" onChange={setEmpName} />
                                <DateRangePicker
                                    size="lg"
                                    showOneCalendar
                                    placement="bottomEnd"
                                    value={dateRangeValue}
                                    placeholder="Filter Range of Date"
                                    onChange={setDateRangeValue}
                                />
                            </div>
                        </div>

                        {
                            isLoading ? <Skeleton
                                sx={{ bgcolor: 'grey.500' }}
                                variant="rectangular"
                                width={"100%"}
                                height={"50vh"}
                            /> :
                                latePunches?.length > 0 ?
                                    <LeaveTable handleLateLogin={handleLateLogin} data={latePunches} lateLoginObj={lateLoginObj} isLoading={isResponsing} replyToLeave={responseToLatePunch} /> : <NoDataFound message="No Late punches data" />
                        }
                        {
                            isLateLogin ? <LateLoginModal
                                type={"View LateLogin"}
                                workTimeTracker={lateLoginObj}
                                isLateLogin={isLateLogin}
                                changeLateLogin={handleLateLogin}
                                lateLoginProof={lateLoginObj?.lateLogin?.proof || []}
                            /> : null
                        }
                    </div>
                </div>
            </div>
    )
}
