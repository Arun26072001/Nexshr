import React, { useContext, useEffect, useState } from 'react';
import Announcementalert from './announcementalert';
import axios from 'axios';
import { toast } from 'react-toastify';
import LeaveTable from '../LeaveTable';
import { EssentialValues } from '../../App';
import NoDataFound from '../payslip/NoDataFound';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Announce = () => {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const [announcements, setAnnouncements] = useState([]);
    const [changeAnnouncement, setChangeAnnouncement] = useState(false);
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState("");

    function handleChangeAnnouncement() {
        setChangeAnnouncement(!changeAnnouncement)
    }

    // Function to handle delete
    const handleDelete = async (announcement) => {
        if (announcement) {
            try {
                setIsDeleting(announcement._id)
                const response = await axios.delete(`${url}api/announcements/${announcement._id}`, {
                    headers: {
                        Authorization: `${data.token}`
                    }
                });
                // Show success notification
                toast.success(response.data.message);
                handleChangeAnnouncement()
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.error('Error deleting announcement:', error);
                toast.error('Failed to delete announcement!');
            } finally {
                setIsDeleting("")
            }
        }
    };

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${url}api/announcements`, {
                    headers: {
                        Authorization: data.token || ""
                    }
                });
                setAnnouncements(response.data.Team || response.data); // Adjust based on your API response structure
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.error('Error fetching announcements:', error);
            }
            setIsLoading(false);
        };

        fetchAnnouncements();
    }, [changeAnnouncement]);

    return (
        <div className='dashboard-parent py-4'>
            <div className="d-flex justify-content-between align-items-center px-3">
                <h5 className='text-daily'>Announcement</h5>
                <Announcementalert handleChangeAnnouncement={handleChangeAnnouncement} />
            </div>
            <div className='profiles mt-3'>
                {
                    isLoading ? <Skeleton
                        sx={{ bgcolor: 'grey.500' }}
                        variant="rectangular"
                        width={"100%"}
                        height={"50vh"}
                    /> :
                        announcements.length > 0 ?
                            <LeaveTable handleDelete={handleDelete} data={announcements} isLoading={isDeleting} /> :
                            <NoDataFound message={"Announcement data not found"} />
                }
            </div>
        </div>

    );
};

export default Announce;