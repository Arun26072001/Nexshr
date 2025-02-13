import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Notification, toaster } from 'rsuite';
import '../../App.css';
import { toast } from 'react-toastify';
import CommonModel from '../Administration/CommonModel';
import { EssentialValues } from '../../App';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

// Connect to the backend socket
const socket = io(`${process.env.REACT_APP_API_URL}`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

const AnnouncementComponent = ({ handleChangeAnnouncement }) => {
    const { data } = useContext(EssentialValues);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [team_member, setTeam_member] = useState([]);
    const [announcementObj, setAnnouncementObj] = useState({})
    const url = process.env.REACT_APP_API_URL;

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `${data.token}`,
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*',
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
                console.log(response.data);

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
    console.log(announcementObj);


    const handleSubmit = async () => {

        try {
            const addAnnounce = await axios.post(`${url}/api/announcements/${data._id}`, announcementObj,
                { headers }
            );
            handleChangeAnnouncement();
            handleModel()
            toast.success(addAnnounce.data.message);
        } catch (error) {
            toast.error(error.response.data.error)
            console.error('Error creating the announcement or sending notification:', error);
        }
    };

    useEffect(() => {
        const userId = "6732dc5eaa4b04df4496db28";
        socket.emit('registerUser', userId);
        socket.on('receiveNotification', ({ title, message }) => {
            console.log("Received notification:", title, message);
            const companyLogo = 'https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public'; // Replace with your company logo URL
            const companyName = 'Webnexs';

            toaster.push(
                <Notification
                    header={
                        <div style={{ display: 'flex', alignItems: 'center' }}>

                            <img src={companyLogo} alt="Company Logo" style={{ width: 50, height: 50, marginRight: 10 }} />

                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{companyName}</span>
                        </div>
                    }
                    closable
                >
                    <strong>{title}</strong>
                    <br />
                    {message}
                </Notification>,
                { placement: 'bottomEnd' }
            );
        });

        return () => {
            socket.off('receiveNotification');
        };
    }, []);

    // const handleSendNotification = () => {
    //     if (selectedUsers.length > 0 && title && message) {
    //         let userIds = [];


    //         const getUserIdsForTeam = (teamValue) => {
    //             const team = team_member[0].children.find(team => team.value === teamValue);
    //             return team ? team.children.map(user => user.id) : [];
    //         };

    //         if (selectedUsers.includes('select-all')) {

    //             userIds = team_member[0].children.flatMap(team => team.children.map(user => user.id));
    //         } else {

    //             const teamKeys = ['designing', 'developers', 'testing', 'digital-marketing', 'sales'];
    //             teamKeys.forEach(teamKey => {
    //                 if (selectedUsers.includes(teamKey)) {
    //                     userIds.push(...getUserIdsForTeam(teamKey));
    //                 }
    //             });


    //             userIds.push(...selectedUsers.map(value => findUserIdByValue(value)).filter(userId => userId !== null));
    //         }

    //         if (userIds.length > 0) {
    //             userIds.forEach(userId => {

    //                 socket.emit('sendNotification', userId, title, message);
    //             });
    //             setTitle('');
    //             setMessage('');
    //         } else {
    //             toaster.push(
    //                 <Notification type="warning" header="Warning">
    //                     Please select at least one valid user, title, and message
    //                 </Notification>,
    //                 { placement: 'bottomEnd' }
    //             );
    //         }
    //     } else {
    //         toaster.push(
    //             <Notification type="warning" header="Warning">
    //                 Please select at least one user, title, and message
    //             </Notification>,
    //             { placement: 'bottomEnd' }
    //         );
    //     }
    // };

    // const findUserIdByValue = (value) => {
    //     for (const team of team_member) {
    //         for (const category of team.children) {
    //             for (const user of category.children) {
    //                 if (user.value === value) {
    //                     return user.id;
    //                 }
    //             }
    //         }
    //     }
    //     return null;
    // };


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
