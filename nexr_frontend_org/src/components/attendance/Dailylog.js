import React, { useContext } from 'react';
import './Attendence.css';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { DateRangePicker, Dropdown, Popover, Whisper } from 'rsuite';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { TimerStates } from '../payslip/HRMDashboard';
import { Skeleton } from '@mui/material';
import { exportAttendanceToExcel } from '../ReuseableAPI';

const Dailylog = ({ attendanceData, isLoading }) => {
    const { data, whoIs } = useContext(EssentialValues)
    const { daterangeValue, setDaterangeValue } = useContext(TimerStates);
    const url = process.env.REACT_APP_API_URL;

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
            console.error('File upload failed:', error);
            toast.error(error.response.attendanceData.error);
        }
    };

    // Format milliseconds to HH:mm:ss
    // const formatMs = (ms) => {
    //     if (!ms || isNaN(ms)) return "00:00:00";
    //     return new Date(ms).toISOString().substr(11, 8);
    // };

    // function exportAttendanceToExcel() {
    //     if (!attendanceData.length) return;

    //     const formattedData = attendanceData.map((item) => ({
    //         Date: item.date.split("T")[0],
    //         Behaviour: item.behaviour,
    //         // PunchInMessage: item.punchInMsg,

    //         // Login
    //         LoginStart: item.login?.startingTime[0] || "00:00",
    //         LoginEnd: item.login?.endingTime.at(-1) || "00:00",
    //         LoginTaken: formatMs(item.login?.takenTime || 0),

    //         // Meeting
    //         MeetingStart: item.meeting?.startingTime[0] || "00:00",
    //         MeetingEnd: item.meeting?.endingTime.at(-1) || "00:00",
    //         MeetingTaken: formatMs(item.meeting?.takenTime || 0),

    //         // Morning Break
    //         MorningBreakStart: item.morningBreak?.startingTime[0] || "00:00",
    //         MorningBreakEnd: item.morningBreak?.endingTime.at(-1) || "00:00",
    //         MorningBreakTaken: formatMs(item.morningBreak?.takenTime || 0),

    //         // Lunch
    //         LunchStart: item.lunch?.startingTime[0] || "00:00",
    //         LunchEnd: item.lunch?.endingTime.at(-1) || "00:00",
    //         LunchTaken: formatMs(item.lunch?.takenTime || 0),

    //         // Evening Break
    //         EveningBreakStart: item.eveningBreak?.startingTime[0] || "00:00",
    //         EveningBreakEnd: item.eveningBreak?.endingTime.at(-1) || "00:00",
    //         EveningBreakTaken: formatMs(item.eveningBreak?.takenTime || 0),

    //         // Event
    //         EventStart: item.event?.startingTime[0] || "00:00",
    //         EventEnd: item.event?.endingTime.at(-1) || "00:00",
    //         EventTaken: formatMs(item.event?.takenTime || 0),
    //     }));

    //     const ws = XLSX.utils.json_to_sheet(formattedData);
    //     const wb = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    //     const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    //     const blob = new Blob([wbout], { type: "application/octet-stream" });

    //     saveAs(blob, "Attendance.xlsx");
    // }

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
                    <Dropdown.Item eventKey={1}>
                        <b>
                            <FileUploadRoundedIcon /> Import
                        </b>
                    </Dropdown.Item>
                    <Dropdown.Item eventKey={2}>
                        <b>
                            <FileDownloadRoundedIcon /> Download
                        </b>
                    </Dropdown.Item>
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
                        value={daterangeValue}
                        placeholder="Select Date Range"
                        onChange={setDaterangeValue}
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
