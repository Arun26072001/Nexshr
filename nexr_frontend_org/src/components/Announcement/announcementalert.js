// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { MultiCascader, VStack } from 'rsuite'; // Ensure 'rsuite' package is installed
// // import { mockTreeData } from './mock';  Import your mock data
// import "../../App.css"; // Your custom CSS

// export default function Announcementalert() {
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [selectedOptions, setSelectedOptions] = useState([]); // Manage selected items
//     const [title, setTitle] = useState('');
//     const [startDate, setStartDate] = useState('');
//     const [endDate, setEndDate] = useState('');
//     const [message, setMessage] = useState('');
//     const [team_member, setTeam_member] = useState([]);
//     const token = localStorage.getItem("token");
//     const Account = localStorage.getItem("Account");
    
//   const headers = {
//     "Content-Type": "application/json",
//     Authorization: "Bearer " + token,
//     Accept: "application/json",
//     "Access-Control-Allow-Origin": "*",
//   };

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await axios.get(
//                     `${process.env.REACT_APP_API_URL}/api/teamssample`, {headers:headers}
//                 );
//                 const data = response?.data?.teams;
//                 setTeam_member(data);
//             } catch (error) {
//                 console.error("Error fetching team members:", error);
//             }
//         };

//         fetchData();
//     }, []);

//     const openModal = () => {
//         setIsModalOpen(true);
//     };

//     const closeModal = () => {
//         setIsModalOpen(false);
//         setSelectedOptions([]);
//         setTitle('');
//         setStartDate('');
//         setEndDate('');
//         setMessage('');
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
    
//         if (!title || !startDate || !endDate || !message || !selectedOptions.length) {
//             console.error("All fields are required");
//             return; // Exit if any required fields are missing
//         }
    
//         const formData = {
//             title,
//             startDate,
//             endDate,
//             message,
//             selectTeamMembers: selectedOptions,
//             role:Account
//         };
    
//         axios.post(`${process.env.REACT_APP_API_URL}/announcement`, formData, { headers: headers })
//             .then(response => {
//                 console.log("Announcement submitted:", response.data);
//                 closeModal(); // Close modal on success
//             })
//             .catch(error => {
//                 console.error("Error creating the announcement:", error);
//             });
//     };
    

//     return (
//         <>
//             <div>
//                 <button onClick={openModal} className="btn attend btn-dark w-100" type="button">
//                     Add Announcement
//                 </button>

//                 {isModalOpen && (
//                     <div className="modal show d-block" tabIndex="-1" role="dialog">
//                         <div className="modal-dialog modal-lg" role="document">
//                             <div className="modal-content  modal-lg p-3">
//                                 <div className="modal-header" style={{ padding: "0px 0px 10px 0px" }}>
//                                     <h5 className="title">Add announcement</h5>
//                                     <button type="button" className="close" onClick={closeModal}>
//                                         <span>&times;</span>
//                                     </button>
//                                 </div>
//                                 <div>
//                                     <form onSubmit={handleSubmit}>
//                                         <div className="form-group mt-3">
//                                             <label htmlFor="name">Title</label>
//                                             <input
//                                                 type="text"
//                                                 className="form-control"
//                                                 id="name"
//                                                 placeholder="Enter title"
//                                                 value={title}
//                                                 onChange={(e) => setTitle(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="startDate" className="form-label">Start Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="startDate"
//                                                 value={startDate}
//                                                 onChange={(e) => setStartDate(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="endDate" className="form-label">End Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="endDate"
//                                                 value={endDate}
//                                                 onChange={(e) => setEndDate(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="form-group">
//                                             <label htmlFor="members">Select Team Members</label>
//                                             <VStack>
//                                                 <MultiCascader
//                                                     className="pt-2"
//                                                     data={team_member} // Corrected the data source
//                                                     onChange={(value) => setSelectedOptions(value)}
//                                                     style={{ width: '100%' }}
//                                                     placeholder="Select team members"
//                                                     searchable
//                                                     checkAll
//                                                 />
//                                             </VStack>
//                                         </div>

//                                         <div className="form-group">
//                                             <label htmlFor="message">Message</label>
//                                             <textarea
//                                                 className="form-control message-textarea"
//                                                 id="message"
//                                                 placeholder="Enter message"
//                                                 value={message}
//                                                 onChange={(e) => setMessage(e.target.value)}
//                                                 required
//                                             ></textarea>
//                                         </div>

//                                         <div className="modal-actions">
//                                             <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
//                                             <button type="submit" className="btn btn-primary">Save</button>
//                                         </div>
//                                     </form>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// }



// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { MultiCascader, VStack } from 'rsuite';
// import "../../App.css";
// import { requestForToken, onMessageListener } from "./firebase";

// export default function Announcementalert() {
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [selectedOptions, setSelectedOptions] = useState([]);
//     const [title, setTitle] = useState('');
//     const [startDate, setStartDate] = useState('');
//     const [endDate, setEndDate] = useState('');
//     const [message, setMessage] = useState('');
//     const [team_member, setTeam_member] = useState([]);
//     const token = localStorage.getItem("token");
//     const Account = localStorage.getItem("Account");

//     const headers = {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         Accept: "application/json",
//         "Access-Control-Allow-Origin": "*",
//     };

    
//   useEffect(() => {
//     const requestForNotification = async () => {
//       const token = await requestForToken();
//       if (token) {
//         // Send token to the backend server
//         await fetch(`${process.env.REACT_APP_API_URL}/api/subscribe`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ token }),
//         });

//         // Optionally send a notification right after subscribing
//         await fetch(`${process.env.REACT_APP_API_URL}/api/send-notification`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             title: "title",
//             body: message,
//             token: token,
//           }),
//         });
//       }
//     };

//     requestForNotification();

//     // Listen for messages
//     onMessageListener()
//       .then((payload) => {
//         console.log("Message received: ", payload);
//         alert(payload.notification.title);
//       })
//       .catch((err) => console.log("Failed to receive message: ", err));
//   }, []);



//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await axios.get(
//                     `${process.env.REACT_APP_API_URL}/api/teamssample`, { headers }
//                 );
//                 const data = response?.data?.teams;
//                 setTeam_member(data);
//             } catch (error) {
//                 console.error("Error fetching team members:", error);
//             }
//         };

//         fetchData();
//     }, []);

//     const openModal = () => {
//         setIsModalOpen(true);
//     };

//     const closeModal = () => {
//         setIsModalOpen(false);
//         setSelectedOptions([]);
//         setTitle('');
//         setStartDate('');
//         setEndDate('');
//         setMessage('');
//     };

//     // useEffect(() => {
//     //     const requestForNotification = async () => {
//     //         const token = await requestForToken();
//     //         if (token) {
//     //             try {
//     //                 await axios.post(`${process.env.REACT_APP_API_URL}/api/subscribe`, { token });
//     //             } catch (error) {
//     //                 console.error("Failed to subscribe token:", error);
//     //             }
//     //         }
//     //     };
    
//     //     requestForNotification();
    
//     //     onMessageListener()
//     //         .then((payload) => {
//     //             console.log("Message received: ", payload);
//     //             alert("teast" , payload.notification.title, "teast");
//     //         })
//     //         .catch((err) => console.log("Failed to receive message: ", err));
//     // }, []);

    
//     const handleSubmit = async (e) => {
//         e.preventDefault();
    
//         if (!title || !startDate || !endDate || !message || !selectedOptions.length) {
//             console.error("All fields are required");
//             return;
//         }
    
//         const formData = {
//             title,
//             startDate: new Date(startDate),
//             endDate: new Date(endDate),
//             message,
//             selectTeamMembers: selectedOptions,
//             role: Account
//         };
    
//         try {
//             // Submit announcement to the backend
//             const response = await axios.post(
//                 `${process.env.REACT_APP_API_URL}/api/announcements`,
//                 formData,
//                 { headers }
//             );
//             console.log("Announcement submitted:", response.data);
    
//             // Retrieve token for push notification
//             const token = await requestForToken();
//             if (token) {
//                 // Trigger push notification with token
//                 const response = await axios.post(
//                     `${process.env.REACT_APP_API_URL}/api/send-notification`,
//                     {
//                         title: formData.title,
//                         body: "formData.messagess",
//                         token,
//                      collapseKey: "announcement",
//                         topic: "loggedInUsers"
//                     },
//                     { headers }
//                 );
                                
//                 console.log("Notification sent successfully", response);
//             } else {
//                 console.error("Failed to obtain token for notification");
//             }
    
//             // closeModal(); // Close modal on success
//         } catch (error) {
//             console.error("Error creating the announcement or sending notification:", error);
//         }
//     };
    
    

//     return (
//         <>
//             <div>
//                 <button onClick={openModal} className="btn attend btn-dark w-100" type="button">
//                     Add Announcement
//                 </button>

//                 {isModalOpen && (
//                     <div className="modal show d-block" tabIndex="-1" role="dialog">
//                         <div className="modal-dialog modal-lg" role="document">
//                             <div className="modal-content modal-lg p-3">
//                                 <div className="modal-header" style={{ padding: "0px 0px 10px 0px" }}>
//                                     <h5 className="title">Add announcement</h5>
//                                     <button type="button" className="close" onClick={closeModal}>
//                                         <span>&times;</span>
//                                     </button>
//                                 </div>
//                                 <div>
//                                     {/* <form > */}
//                                         <div className="form-group mt-3">
//                                             <label htmlFor="name">Title</label>
//                                             <input
//                                                 type="text"
//                                                 className="form-control"
//                                                 id="name"
//                                                 placeholder="Enter title"
//                                                 value={title}
//                                                 onChange={(e) => setTitle(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="startDate" className="form-label">Start Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="startDate"
//                                                 value={startDate}
//                                                 onChange={(e) => setStartDate(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="endDate" className="form-label">End Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="endDate"
//                                                 value={endDate}
//                                                 onChange={(e) => setEndDate(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="form-group">
//                                             <label htmlFor="members">Select Team Members</label>
//                                             <VStack>
//                                                 <MultiCascader
//                                                     className="pt-2"
//                                                     data={team_member}
//                                                     onChange={(value) => setSelectedOptions(value)}
//                                                     style={{ width: '100%' }}
//                                                     placeholder="Select team members"
//                                                     searchable
//                                                     checkAll
//                                                 />
//                                             </VStack>
//                                         </div>

//                                         <div className="form-group">
//                                             <label htmlFor="message">Message</label>
//                                             <textarea
//                                                 className="form-control message-textarea"
//                                                 id="message"
//                                                 placeholder="Enter message"
//                                                 value={message}
//                                                 onChange={(e) => setMessage(e.target.value)}
//                                                 required
//                                             ></textarea>
//                                         </div>

//                                         <div className="modal-actions">
//                                             <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
//                                             <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Save</button>
//                                         </div>
//                                     {/* </form> */}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// }

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Button, Notification, toaster, MultiCascader, VStack } from 'rsuite';
import '../../App.css';
import 'rsuite/dist/rsuite.min.css';

// Connect to the backend socket
const socket = io(`${process.env.REACT_APP_API_URL}`, {
// const socket = io(`http://localhost:3336`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

const AnnouncementComponent = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [team_member, setTeam_member] = useState([]);
    const token = localStorage.getItem('token');
    const Account = localStorage.getItem('Account');
    const _id = localStorage.getItem('_id');
    
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*',
    };

    
    // Fetch team members data on component load
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/employee/user`, 
                   { headers: {
                        authorization: token || ""
                   }},
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

   
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!title || !startDate || !endDate || !message || !selectedUsers.length) {
            console.error('All fields are required');
            return;
        }
    
        const formData = {
            title,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            message,
            selectTeamMembers: selectedUsers,
            role: Account
        };
    
        try {
            
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/announcements`,
                formData,
                { headers }
            );
            closeModal();
        } catch (error) {
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

    
    const getAllUserIdsFromTeams = (teams) => {
        let allUserIds = [];
        teams.forEach(team => {
            team.children.forEach(category => {
                category.children.forEach(user => {
                    allUserIds.push(user.id); 
                });
            });
        });
        return allUserIds;
    };

    
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
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
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
                                   <button type="submit" className="btn btn-primary"onClick={(event) => { handleSubmit(event); handleSendNotification(); }}>Save</button>
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






























// import React, { useState } from "react";
// import axios from "axios";
// import { MultiCascader, VStack } from 'rsuite'; // Ensure 'rsuite' package is installed
// import { mockTreeData } from './mock'; // Import your mock data
// import "../../App.css";// Your custom CSS

// export default function Announcementalert() {
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [selectedOptions, setSelectedOptions] = useState([]); // Manage selected items
//     const [title, setTitle] = useState('');
//     const [startDate, setStartDate] = useState('');
//     const [endDate, setEndDate] = useState('');
//     const [message, setMessage] = useState('');
//     const [team_member, setTeam_member] = useState('');

// useEffect(async () => {
//   const fetchData = async () => {
//     try {
//       const response = await axios.get(
//         `${process.env.REACT_APP_Baseurl}/api/teamssample`,
//         { headers: headers }
//       );
//       const data = response?.data?.teams;
//       setTeam_member(data);

// )},
//     const openModal = () => {
//         setIsModalOpen(true);
//     };

//     const closeModal = () => {
//         setIsModalOpen(false);
//         setSelectedOptions([]);
//         setTitle(''); 
//         setStartDate(''); // Reset start date
//         setEndDate(''); // Reset end date
//         setMessage(''); // Reset message
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         const formData = {
//             title,          
//             startDate,      
//             endDate,         
//             message,     
//             selectTeamMembers: selectedOptions 
//         };

//         axios.post(`${process.env.REACT_APP_API_URL}/announcement`, formData)
//             .then(response => {
//                 console.log("Announcement submitted:", response.data);
//                 closeModal(); // Close modal on success
//             })
//             .catch(error => {
//                 console.error("Error creating the announcement:", error);
//             });
//     };

//     return (
//         <>
//             <div>
//                 <button onClick={openModal} className="btn attend btn-dark w-100" type="button">
//                     Add Announcement
//                 </button>

//                 {isModalOpen && (
//                     <div className="modal show d-block" tabIndex="-1" role="dialog">
//                         <div className="modal-dialog modal-lg" role="document">
//                             <div className="modal-content p-3">
//                                 <div className="modal-header" style={{padding: "0px 0px 10px 0px"}}>
//                                     <h5 className="title">Add announcement</h5>
//                                     <button type="button" className="close" onClick={closeModal}>
//                                         <span>&times;</span>
//                                     </button>
//                                 </div>
//                                 <div>
//                                     <form onSubmit={handleSubmit}>
//                                         <div className="form-group mt-3">
//                                             <label htmlFor="name">Title</label>
//                                             <input
//                                                 type="text"
//                                                 className="form-control"
//                                                 id="name"
//                                                 placeholder="Enter title"
//                                                 value={title} // Bind to state
//                                                 onChange={(e) => setTitle(e.target.value)} // Update state on change
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="startDate" className="form-label">Start Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="startDate"
//                                                 value={startDate} // Bind to state
//                                                 onChange={(e) => setStartDate(e.target.value)} // Update state on change
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="endDate" className="form-label">End Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="endDate"
//                                                 value={endDate} // Bind to state
//                                                 onChange={(e) => setEndDate(e.target.value)} // Update state on change
//                                                 required
//                                             />
//                                         </div>
                                        
//                                         <div className="form-group">
//                                             <label htmlFor="members ">Select Team Members</label>
//                                             <VStack>
//                                                 <MultiCascader
//                                                 className="pt-2"
//                                                     data={data} // Includes the "Select All" option
//                                                     onChange={(value) => setSelectedOptions(value)} // Set selected options
//                                                     style={{ width: '100%' }}
//                                                     placeholder="Select team members"
//                                                     searchable // Enables the search feature
//                                                     checkAll // Allows selecting all items
//                                                 />
//                                             </VStack>
//                                         </div>

//                                         <div className="form-group">
//                                             <label htmlFor="message">Message</label>
//                                             <textarea
//                                                 className="form-control message-textarea"
//                                                 id="message"
//                                                 placeholder="Enter message"
//                                                 value={message} // Bind to state
//                                                 onChange={(e) => setMessage(e.target.value)} // Update state on change
//                                                 required
//                                             ></textarea>
//                                         </div>

//                                         <div className="modal-actions">
//                                             <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
//                                             <button type="submit" className="btn btn-primary">Save</button>
//                                         </div>
//                                     </form>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// }

// import React, { useState } from "react";
// import axios from "axios";
// import { MultiCascader, VStack } from 'rsuite'; // Ensure 'rsuite' package is installed
// import { mockTreeData } from './mock'; // Import your mock data
// import '../Attendence/Popup.css'; // Your custom CSS

// const data = mockTreeData(); // Generate mock data

// export default function Announcementalert() {
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [selectedOptions, setSelectedOptions] = useState([]);
//     const [title, setTitle] = useState('');
//     const [startDate, setStartDate] = useState('');
//     const [endDate, setEndDate] = useState('');
//     const [message, setMessage] = useState('');

//     const openModal = () => {
//         setIsModalOpen(true);
//     };

//     const closeModal = () => {
//         setIsModalOpen(false);
//         setSelectedOptions([]);
//         setTitle('');
//         setStartDate('');
//         setEndDate('');
//         setMessage('');
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         const formData = {
//             title,
//             startDate,
//             endDate,
//             message,
//             members: selectedOptions
//         };

//         axios.post("http://localhost:5000/announcement", formData)
//             .then(response => {
//                 console.log("Announcement submitted:", response.data);
//                 closeModal();
//             })
//             .catch(error => {
//                 console.error("Error creating the announcement:", error);
//             });
//     };

//     return (
//         <>
//             <div>
//                 <button onClick={openModal} className="btn attend btn-dark w-100" type="button">
//                     Add Announcement
//                 </button>

//                 {isModalOpen && (
//                     <div className="modal show d-block" tabIndex="-1" role="dialog">
//                         <div className="modal-dialog modal-lg" role="document">
//                             <div className="modal-content p-3">
//                                 <div className="modal-header p-0">
//                                     <h5 className="title">Add Announcement</h5>
//                                     <button type="button" className="close" onClick={closeModal}>
//                                         <span>&times;</span>
//                                     </button>
//                                 </div>
//                                 <div>
//                                     <form onSubmit={handleSubmit}>
//                                         <div className="form-group mt-3">
//                                             <label htmlFor="name">Title</label>
//                                             <input
//                                                 type="text"
//                                                 className="form-control"
//                                                 id="name"
//                                                 placeholder="Enter title"
//                                                 value={title}
//                                                 onChange={(e) => setTitle(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="startDate" className="form-label">Start Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="startDate"
//                                                 value={startDate}
//                                                 onChange={(e) => setStartDate(e.target.value)}
//                                                 required
//                                             />
//                                         </div>

//                                         <div className="mb-2">
//                                             <label htmlFor="endDate" className="form-label">End Date</label>
//                                             <input
//                                                 type="date"
//                                                 className="form-control"
//                                                 id="endDate"
//                                                 value={endDate}
//                                                 onChange={(e) => setEndDate(e.target.value)}
//                                                 required
//                                             />
//                                         </div>
                                        
//                                         <div className="form-group">
//                                             <label htmlFor="members">Select Team Members</label>
//                                             <VStack>
//                                                 <MultiCascader
//                                                     className="pt-2"
//                                                     data={data}
//                                                     onChange={(value) => setSelectedOptions(value)}
//                                                     style={{ width: '100%' }}
//                                                     placeholder="Select team members"
//                                                     searchable
//                                                     checkAll
//                                                 />
//                                             </VStack>
//                                         </div>

//                                         <div className="form-group">
//                                             <label htmlFor="message">Message</label>
//                                             <textarea
//                                                 className="form-control message-textarea"
//                                                 id="message"
//                                                 placeholder="Enter message"
//                                                 value={message}
//                                                 onChange={(e) => setMessage(e.target.value)}
//                                                 required
//                                             ></textarea>
//                                         </div>

//                                         <div className="modal-actions">
//                                             <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
//                                             <button type="submit" className="btn btn-primary">Save</button>
//                                         </div>
//                                     </form>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// }
