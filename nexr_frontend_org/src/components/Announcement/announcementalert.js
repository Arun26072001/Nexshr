import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import '../../App.css';
import { toast } from 'react-toastify';
import CommonModel from '../Administration/CommonModel';
import { EssentialValues } from '../../App';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import companyLogo from "../../imgs/webnexs_logo.webp";

const AnnouncementComponent = ({ handleChangeAnnouncement }) => {
    const { data, sendNotification } = useContext(EssentialValues);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [team_member, setTeam_member] = useState([]);
    const [announcementObj, setAnnouncementObj] = useState({})
    const url = process.env.REACT_APP_API_URL;
    // Connect to the backend socket
    const socket = io(`${url}`, {
        autoConnect: false
    });

    const headers = {
        Authorization: data.token || ""
    };

    // Fetch team members data on component load
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${url}/api/employee/user`,
                    {
                        headers: {
                            authorization: `${data.token}`
                        }
                    },
                );
                setTeam_member(response?.data?.Team || []);
            } catch (error) {
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
        console.log(value);

        setAnnouncementObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    const handleSubmit = async () => {

        try {
            const addAnnounce = await axios.post(`${url}/api/announcements/${data._id}`, announcementObj,
                { headers }
            );
            handleChangeAnnouncement();
            handleModel();
            toast.success(addAnnounce.data.message);
            socket.connect();
            socket.on("connect", () => {
                socket.emit('add-announcement', announcementObj, announcementObj?.selectTeamMembers);
            });
        } catch (error) {
            toast.error(error.response.data.error)
            console.error('Error creating the announcement or sending notification:', error);
        }
    };

    useEffect(() => {
        socket.connect();
            socket.on("connect", () => {
                console.log("connected");
            });
        socket.on("send-notification", (emps, title, message) => {
            console.log("Received Notification:", emps, title, message);
            sendNotification(emps, companyLogo, title, message);
        });

        return () => {
            socket.off("send-notification");
        };
    },[]);


    return (
        <div>
            <button onClick={handleModel} className='button'>
                <AddRoundedIcon /> Announcement
            </button>

            {isModalOpen && (
                <CommonModel type="Announcement" isAddData={isModalOpen} modifyData={handleModel} changeData={changeAnnouncementData} addData={handleSubmit} team_member={team_member} dataObj={announcementObj} />
            )}
        </div>
    );
};

export default AnnouncementComponent;
