import React, { useEffect, useState } from 'react';
import Announcementalert from './announcementalert';
import axios from 'axios';
import { toast } from 'react-toastify';
import LeaveTable from '../LeaveTable';
import Loading from '../Loader';

const Announce = () => {
    const url = process.env.REACT_APP_API_URL;
    const [announcements, setAnnouncements] = useState([]);
    const [changeAnnouncement, setChangeAnnouncement] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);  // For managing the menu anchor element
    const token = localStorage.getItem("token");
    const [isLoading, setIsLoading] = useState(false);

    function handleChangeAnnouncement() {
        setChangeAnnouncement(!changeAnnouncement)
    }

    // Function to handle delete
    const handleDelete = async (announcementId) => {
        if (announcementId) {
            try {
                const response = await axios.delete(`${url}/api/announcements/${announcementId}`, {
                    headers: {
                        Authorization: `${token}`
                    }
                });

                if (response.status !== 200) {
                    throw new Error('Failed to delete announcement');
                }

                // Remove the deleted announcement from the state
                setAnnouncements(announcements.filter(announcement => announcement.announcementId !== announcementId));
                setAnchorEl(null); // Close the menu after deletion

                // Show success notification
                toast.success('Announcement deleted successfully!');
            } catch (error) {
                console.error('Error deleting announcement:', error);
                toast.error('Failed to delete announcement!');
            }
        }
    };

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${url}/api/announcements`, {
                    headers: {
                        Authorization: token || ""
                    }
                });
                const data = response.data;
                
                setAnnouncements(data.Team || data); // Adjust based on your API response structure
            } catch (error) {
                console.error('Error fetching announcements:', error);
            }
            setIsLoading(false);
        };

        fetchAnnouncements();
    }, [changeAnnouncement]);

    return (
        isLoading ? <Loading /> :
            <div className='dashboard-parent py-4'>
                <div className="d-flex  justify-content-between align-items-center">
                    <div>
                        <h5 className='text-daily'>Announcement</h5>
                    </div>
                    <div className='d-flex'>
                        <Announcementalert handleChangeAnnouncement={handleChangeAnnouncement} />
                    </div>
                </div>
                <div className='tabline mt-3 p-4'>
                    <div className='profiles mt-3'>
                        <LeaveTable handleDelete={handleDelete} data={announcements} />
                    </div>
                </div>
            </div>

    );
};

export default Announce;