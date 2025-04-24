import React, { useContext } from 'react';
import './Attendence.css';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { DateRangePicker, Dropdown, Popover, Whisper } from 'rsuite';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { TimerStates } from '../payslip/HRMDashboard';
import { Skeleton } from '@mui/material';

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
                    'Content-Type': 'multipart/form-data',
                    Authorization: data.token || ""
                },
            });
            toast.success(response.data.message)
        } catch (error) {
            console.error('File upload failed:', error);
            toast.error(error.response.data.error);
        }
    };

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
                alert('Add clicked');
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
                            <AddRoundedIcon /> Add
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
                    {/* <div className='text-center'>
                            <Popup />
                        </div> */}
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
                    sx={{ bgcolor: 'grey.500' }}
                    variant="rectangular"
                    width={"100%"}
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
