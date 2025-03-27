import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const AdminOrgSettings = ({ organizations }) => {
    // const { organizationId } = useParams(); // Fetch the organization ID from the URL
    // const organization = organizations?.find(org => org._id === organizationId); // Find the matching organization
    // console.log(organization)
    // State for form inputs
    const [formData, setFormData] = useState({});

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Updated Organization Details:', formData);
        // Add logic to save changes, e.g., API call
    };

    return (
        <div className="p-4 w-full">
            <p className="titleText text-start">Mail Settings</p>
            <div className="row">
                <div className="col-md-6">
                    <div className={`box-content messageCount cardContent text-dark d-block activeCard`} style={{ background: "white", textAlign: "center", height: "100%", boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}>
                        <div className="d-flex">
                            <div className="col-lg-5 text-start"><b>FROM EMAIL</b></div>
                            <div className="col-lg-5 text-start">  hr@webnexs.com</div> {/* Add value if needed */}
                        </div>
                        <div className="d-flex">
                            <div className="col-lg-5 text-start"><b>POSTMARK TOKEN</b></div>
                            <div className="col-lg-5 text-start">  5403b130-ff09-4e7f-bc85-999c75a4413b</div> {/* Add value if needed */}
                        </div>
                    </div>
                </div>
                <div className="col-md-6" >
                    <div className={`box-content messageCount cardContent text-dark d-block`}
                        style={{
                            background: "white",
                            textAlign: "center",
                            boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px"
                        }}>
                        <div className="d-flex">
                            <div className="col-lg-5 text-start"><b>MAIL HOST</b></div>
                            <div className="col-lg-5 text-start">  server.webnexs.in</div>
                        </div>
                        <div className="d-flex">
                            <div className="col-lg-5 text-start"><b>MAIL PORT</b></div>
                            <div className="col-lg-5 text-start">  587</div>
                        </div>
                        <div className="d-flex">
                            <div className="col-lg-5 text-start"><b>MAIL USER</b></div>
                            <div className="col-lg-5 text-start">  demo@webnexs.in</div>
                        </div>
                        <div className="d-flex">
                            <div className="col-lg-5 text-start"><b>FROM EMAIL</b></div>
                            <div className="col-lg-5 text-start">  hr@webnexs.com</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrgSettings;
