import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Button, Notification, toaster, MultiCascader, VStack } from 'rsuite';
import '../../App.css';
import 'rsuite/dist/rsuite.min.css';
import { toast } from 'react-toastify';

// Connect to the backend socket
const socket = io(`${process.env.REACT_APP_API_URL}`, {
    // const socket = io(`http://localhost:3336`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

const AnnouncementComponent = ({ handleChangeAnnouncement }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [team_member, setTeam_member] = useState([]);
    const token = localStorage.getItem('token');
    const Account = localStorage.getItem('Account');
    // const _id = localStorage.getItem('_id');
    const url = process.env.REACT_APP_API_URL;

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `${token}`,
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
                            authorization: `${token}`
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

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTitle('');
        setStartDate('');
        setEndDate('');
        setMessage('');
        setSelectedUsers([]);
    };


    const handleSubmit = async () => {

        const formData = {
            title,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            message,
            selectTeamMembers: selectedUsers,
            role: Account
        };
        console.log(formData);

        try {
            const addAnnounce = await axios.post(`${url}/api/announcements`, formData,
                { headers }
            );
            handleChangeAnnouncement();
            closeModal();
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

    const handleSendNotification = () => {
        if (selectedUsers.length > 0 && title && message) {
            let userIds = [];


            const getUserIdsForTeam = (teamValue) => {
                const team = team_member[0].children.find(team => team.value === teamValue);
                return team ? team.children.map(user => user.id) : [];
            };

            if (selectedUsers.includes('select-all')) {

                userIds = team_member[0].children.flatMap(team => team.children.map(user => user.id));
            } else {

                const teamKeys = ['designing', 'developers', 'testing', 'digital-marketing', 'sales'];
                teamKeys.forEach(teamKey => {
                    if (selectedUsers.includes(teamKey)) {
                        userIds.push(...getUserIdsForTeam(teamKey));
                    }
                });


                userIds.push(...selectedUsers.map(value => findUserIdByValue(value)).filter(userId => userId !== null));
            }

            if (userIds.length > 0) {
                userIds.forEach(userId => {

                    socket.emit('sendNotification', userId, title, message);
                });
                setTitle('');
                setMessage('');
            } else {
                toaster.push(
                    <Notification type="warning" header="Warning">
                        Please select at least one valid user, title, and message
                    </Notification>,
                    { placement: 'bottomEnd' }
                );
            }
        } else {
            toaster.push(
                <Notification type="warning" header="Warning">
                    Please select at least one user, title, and message
                </Notification>,
                { placement: 'bottomEnd' }
            );
        }
    };



    const findUserIdByValue = (value) => {
        for (const team of team_member) {
            for (const category of team.children) {
                for (const user of category.children) {
                    if (user.value === value) {
                        return user.id;
                    }
                }
            }
        }
        return null;
    };
    console.log("Single user selection:", selectedUsers, "Found ID:", findUserIdByValue(selectedUsers[0]));


    return (
        <div>
            <button onClick={openModal} className="btn attend btn-dark w-100" type="button">
                Add Announcement
            </button>

            {isModalOpen && (
                <div className="modal show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-content modal-lg" role="document">
                        <div className="modal-lg">
                            <div className="modal-header" style={{ padding: '0px 0px 10px 0px' }}>
                                <h5 className="title">Add announcement</h5>
                                <button type="button" className="close" onClick={closeModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div>
                                <div className="form-group mt-3">
                                    <label htmlFor="name">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="name"
                                        placeholder="Enter title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-2">
                                    <label htmlFor="startDate" className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="startDate"
                                        min={new Date().toISOString().split("T")[0]}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-2">
                                    <label htmlFor="endDate" className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="endDate"
                                        min={new Date().toISOString().split("T")[0]}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="members">Select Team Members</label>
                                    <VStack>
                                        <MultiCascader
                                            className="pt-2"
                                            data={team_member}
                                            onChange={(value) => setSelectedUsers(value)}
                                            style={{ width: '100%' }}
                                            placeholder="Select team members"
                                            searchable
                                            checkAll
                                        />
                                    </VStack>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        className="form-control message-textarea"
                                        id="message"
                                        placeholder="Enter message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementComponent;
