import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import '../../App.css';
import { toast } from 'react-toastify';
import CommonModel from '../Administration/CommonModel';
import { EssentialValues } from '../../App';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from 'react-router-dom';

const AnnouncementComponent = ({ handleChangeAnnouncement }) => {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [team_member, setTeam_member] = useState([]);
    const [announcementObj, setAnnouncementObj] = useState({})
    const [isChangingAnnouncement, setIschangingAnnouncement] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");


    const headers = {
        Authorization: data.token || ""
    };

    // Fetch team members data on component load
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${url}/api/employee/user`,
                    { headers },
                );
                setTeam_member(response?.data?.Team || []);
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.error('Error fetching team members:', error);
            }
        };
        fetchData();
    }, []);

    function handleModel() {
        if (isModalOpen) {
            setAnnouncementObj({})
        }
        setIsModalOpen(!isModalOpen)
    }

    function changeAnnouncementData(value, name) {
        setAnnouncementObj((pre) => ({
            ...pre,
            [name]: typeof value === "string" ? value?.trimStart()?.replace(/\s+/g, ' ') : value
        }))
    }

    const handleSubmit = async () => {
        if (!announcementObj.selectTeamMembers || announcementObj.selectTeamMembers.length === 0) {
            toast.error("Please select at least one employee");
            return;
        }

        setIschangingAnnouncement(true);
        try {
            const addAnnounce = await axios.post(`${url}/api/announcements/${data._id}`, announcementObj,
                { headers }
            );
            handleChangeAnnouncement();
            handleModel();
            toast.success(addAnnounce.data.message);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            setErrorMsg(error.response.data.error)
            toast.error(error?.response?.data?.error)
            console.error('Error creating the announcement or sending notification:', error);
        }
        setIschangingAnnouncement(false);
    };


    return (
        <div>
            <button onClick={handleModel} className='button'>
                <AddRoundedIcon /> Announcement
            </button>

            {isModalOpen && (
                <CommonModel type="Announcement" errorMsg={errorMsg} isAddData={isModalOpen} isWorkingApi={isChangingAnnouncement} modifyData={handleModel} changeData={changeAnnouncementData} addData={handleSubmit} team_member={team_member} dataObj={announcementObj} />
            )}
        </div>
    );
};

export default AnnouncementComponent;
