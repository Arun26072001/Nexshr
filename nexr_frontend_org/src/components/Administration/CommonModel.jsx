import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

const CommonModel = ({
    dataObj,
    editData,
    changeData,
    isAddData,
    addData,
    modifyData,
    type // New prop to determine if it's for "department" or "position"
}) => {
    const [companies, setCompanies] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");

    // Fetch companies data
    const fetchCompanies = async () => {
        try {
            const response = await axios.get(url + "/api/company", {
                headers: {
                    authorization: `Bearer ${token}`
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
        <Modal open={isAddData} size="sm" backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    {dataObj?._id ? `Edit ${type}` : `Add a ${type}`}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="modelInput">
                    <p>{type} Name</p>
                    <input
                        className='form-control'
                        type="text"
                        name={`${type}Name`}
                        value={dataObj?.[`${type}Name`] || ""}
                        onChange={changeData}
                        placeholder={`Please enter a ${type} name...`}
                    />
                </div>
                {type === "Department" || type === "Position" ? (
                    <div className="modelInput">
                        <p>Company</p>
                        <select
                            className='form-control'
                            name="company"
                            value={
                                Array.isArray(dataObj?.company) ? dataObj.company[0]?._id : dataObj?.company || ""
                            }
                            onChange={changeData}
                        >
                            <option value="">Select a Company</option>
                            {companies.map((company) => (
                                <option key={company._id} value={company._id}>
                                    {company.CompanyName}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={modifyData} appearance="subtle">
                    Close
                </Button>
                <Button
                    onClick={dataObj?._id ? editData : addData}
                    appearance="primary"
                    disabled={!dataObj?.[`${type}Name`] || (type === "department" && !dataObj?.company)}
                >
                    {dataObj?._id ? "Update" : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CommonModel;
