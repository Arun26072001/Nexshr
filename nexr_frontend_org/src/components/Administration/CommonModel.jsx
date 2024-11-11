import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from 'rsuite';
import 'rsuite/dist/rsuite.min.css'; // Make sure to import the CSS

const CommonModel = ({
    changeDepartment,
    isAddDepartment,
    departmentObj,
    modifyDepartments,
    addDepartment,
    editDepartment
}) => {
    const [companies, setCompanies] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    console.log(departmentObj?.company[0]?.CompanyName);

    // Fetch companies data
    const fetchCompanies = async () => {
        try {
            const response = await axios.get(url + "/api/company", {
                headers: {
                    authorization: token || ""
                }
            });
            setCompanies(response.data);
        } catch (err) {
            console.error("Error fetching companies:", err.message || err);
        }
    };

    // Fetch companies on component mount
    useEffect(() => {
        fetchCompanies();
    }, []);

    return (
        <Modal open={isAddDepartment} size={'sm'} backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    {departmentObj?._id ? "Edit Department" : "Add a Department"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="modelInput">
                    <p>Department Name</p>
                    <input
                        className='form-control'
                        type="text"
                        name="DepartmentName"
                        value={departmentObj?.DepartmentName || ""}
                        onChange={(e) => changeDepartment(e)}
                        placeholder="Please enter a Department name..."
                    />
                </div>
                <div className="modelInput">
                    <p>Company</p>
                    <select
                        className='form-control'
                        name="company"
                        value={departmentObj?.company[0]?._id || departmentObj.company || ""}
                        onChange={(e) => changeDepartment(e)}
                    >
                        <option value="">Select a Company</option>
                        {
                            companies.map((company) => (
                                <option key={company._id} value={company._id}>
                                    {company.CompanyName}
                                </option>
                            ))
                        }
                    </select>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={modifyDepartments} appearance="subtle">
                    Close
                </Button>
                <Button
                    onClick={departmentObj?._id ? editDepartment : addDepartment}
                    appearance="primary"
                    disabled={!departmentObj?.DepartmentName || !departmentObj?.company}
                >
                    {departmentObj?._id ? "Update" : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CommonModel;
