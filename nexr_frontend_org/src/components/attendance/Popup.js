import React, { useState } from "react";
import './Popup.css'; // Import your CSS for modal styling

function Popup() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div >
            <button onClick={openModal} className="btn attend btn-dark w-100" type="button" id="dropdownMenuButton1"> <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_2237_6442)">
                    <path d="M14 9L6.96552 9M14 9L11.5172 6.43939M14 9L11.5172 11.5606M7.37931 2.5L3.65517 2.5C2.74105 2.5 2 3.20549 2 4.07576L2 13.9242C2 14.7945 2.74105 15.5 3.65517 15.5L7.37931 15.5" stroke="#F5F5F5" stroke-width="1.20741" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <defs>
                    <clipPath id="clip0_2237_6442">
                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                    </clipPath>
                </defs>
            </svg> Add Attendance
            </button>

            {/* Modal starts here */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Attendance</h3>
                        <form>
                            <div className="form-group mt-2">
                                <label>Employee</label>
                                <input type="text" placeholder="Enter employee name" />
                            </div>
                            <div className="row">
                                <div className="col-6 col-sm-6 col-md-6 col-lg-6">
                                    <div className="form-group">
                                        <label>Punch In</label>
                                        <input type="date" />
                                    </div>
                                </div>

                                <div className="col-6 col-sm-6 col-md-6 col-lg-6">
                                    <div className="form-group">
                                        <label>Punch Out</label>
                                        <input type="date" />
                                    </div>
                                </div>

                            </div>

                            <div className="form-group">
                                <label>Reason</label>
                                <textarea placeholder="Reason Note"></textarea>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="save-btn">Save</button>
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Popup;
