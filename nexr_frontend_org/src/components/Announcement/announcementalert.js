import React, { useState, useEffect } from "react";
import axios from "axios";
import { MultiCascader, VStack } from 'rsuite'; // Ensure 'rsuite' package is installed
// import { mockTreeData } from './mock';  Import your mock data
import "../../App.css"; // Your custom CSS

export default function Announcementalert() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]); // Manage selected items
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [team_member, setTeam_member] = useState([]);
    const token = localStorage.getItem("token");
    const Account = localStorage.getItem("Account");
    
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
  };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/teamssample`, {headers:headers}
                );
                const data = response?.data?.teams;
                setTeam_member(data);
            } catch (error) {
                console.error("Error fetching team members:", error);
            }
        };

        fetchData();
    }, []);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOptions([]);
        setTitle('');
        setStartDate('');
        setEndDate('');
        setMessage('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        if (!title || !startDate || !endDate || !message || !selectedOptions.length) {
            console.error("All fields are required");
            return; // Exit if any required fields are missing
        }
    
        const formData = {
            title,
            startDate,
            endDate,
            message,
            selectTeamMembers: selectedOptions,
            role:Account
        };
    
        axios.post(`${process.env.REACT_APP_API_URL}/announcement`, formData, { headers: headers })
            .then(response => {
                console.log("Announcement submitted:", response.data);
                closeModal(); // Close modal on success
            })
            .catch(error => {
                console.error("Error creating the announcement:", error);
            });
    };
    

    return (
        <>
            <div>
                <button onClick={openModal} className="btn attend btn-dark w-100" type="button">
                    Add Announcement
                </button>

                {isModalOpen && (
                    <div className="modal show d-block" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content  modal-lg p-3">
                                <div className="modal-header" style={{ padding: "0px 0px 10px 0px" }}>
                                    <h5 className="title">Add announcement</h5>
                                    <button type="button" className="close" onClick={closeModal}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                                <div>
                                    <form onSubmit={handleSubmit}>
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
                                                    data={team_member} // Corrected the data source
                                                    onChange={(value) => setSelectedOptions(value)}
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
                                            <button type="submit" className="btn btn-primary">Save</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}


































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
