import React, { useContext, useEffect, useState } from 'react';
import './Attendence.css';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { DateRangePicker, Dropdown, Popover, Whisper } from 'rsuite';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { Skeleton } from '@mui/material';
import { exportAttendanceToExcel } from '../ReuseableAPI';
import { useNavigate } from 'react-router-dom';

const Dailylog = () => {
    const { data, whoIs } = useContext(EssentialValues);
    const [attendanceData, setAttendanceData] = useState([]);
    const [dateRangeValue, setDateRangeValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const url = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();

    // Handle file upload
    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('documents', file);

        try {
            const response = await axios.post(`${url}/api/google-sheet/upload/attendance`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-attendanceData',
                    Authorization: data.token || ""
                },
            });
            toast.success(response.attendanceData.message)
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error('File upload failed:', error);
            toast.error(error.response.attendanceData.error);
        }
    };

    const getAttendanceData = async () => {
        try {
            setIsLoading(true);
            const empOfAttendances = await axios.get(`${url}/api/clock-ins/`, {
                params: {
                    dateRangeValue
                },
                headers: {
                    Authorization: data.token || ""
                }
            });
            if (empOfAttendances && empOfAttendances.data) {
                setAttendanceData(empOfAttendances.data);
            }
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error("error in fetch attendance data", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getAttendanceData();
    }, [dateRangeValue])

    const renderMenu = ({ onClose, right, top, className }, ref) => {
        const handleSelect = (eventKey) => {
            if (eventKey === 1) {
                // Trigger the Uploader
                document.getElementById('fileUploader').click();
            } else if (eventKey === 2) {
                // Handle download logic
                alert('Download clicked');
            } else if (eventKey === 3) {
                // Handle add logic
                exportAttendanceToExcel(attendanceData);
            }
            onClose();
        };

        return (
            <Popover ref={ref} className={className} style={{ right, top }}>
                <Dropdown.Menu onSelect={handleSelect}>
                    <Dropdown.Item eventKey={3}>
                        <b>
                            <FileDownloadRoundedIcon /> Export
                        </b>
                    </Dropdown.Item>

                </Dropdown.Menu>
            </Popover>
        );
    };

    return (
        <div className='dashboard-parent pt-4'>
            <div className='d-flex justify-content-between align-items-center px-3'>
                <div>
                    <h5 className='text-daily'>Daily Log</h5>
                </div>

                <div className='d-flex gap-3'>
                    <DateRangePicker
                        size="lg"
                        showOneCalendar
                        placement="bottomEnd"
                        value={dateRangeValue}
                        placeholder="Filter Range of Date Range"
                        onChange={setDateRangeValue}
                    />
                    {
                        ["admin", "hr"].includes(whoIs) &&
                        <button className='button' style={{ cursor: 'pointer' }}>
                            <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
                                Action <ArrowDropDownRoundedIcon />
                            </Whisper>
                        </button>
                    }
                </div>
            </div>

            {/* Hidden file input for upload */}
            <input
                type="file"
                id="fileUploader"
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files[0])}
            />

            {
                isLoading ? <Skeleton
                    className='my-2'
                    sx={{ bgcolor: 'grey.500' }}
                    variant="rounded"
                    height={"50vh"}
                /> :
                    attendanceData.length > 0 ?
                        <LeaveTable data={attendanceData} /> :
                        <NoDataFound message="Attendance data not found" />
            }

        </div>
    );
};

export default Dailylog;
