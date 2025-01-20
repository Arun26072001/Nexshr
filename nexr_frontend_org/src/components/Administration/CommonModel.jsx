import axios from 'axios';
import React, { useEffect, useState } from 'react';
import "../Settings/SettingsStyle.css";
import { Modal, Button, SelectPicker } from 'rsuite';

const CommonModel = ({
    dataObj,
    editData,
    changeData,
    isAddData,
    addData,
    modifyData,
    emps,
    teams,
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
    console.log(emps);
    

    return (
        <Modal open={isAddData} size="sm" backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    {dataObj?._id ? `Edit ${type}` : `Add a ${type}`}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex justify-content-between">
                    <div className="col-half">
                        <div className="modelInput">
                            <p className='modelLabel'>{type} Name: </p>
                            <input
                                className='form-control'
                                type="text"
                                name={`${type}Name`}
                                value={dataObj?.[`${type}Name`] || ""}
                                onChange={changeData}
                            />
                        </div>
                    </div>
                    {type === "Project" && (
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>{type} Prefix:</p>
                                <input
                                    className='form-control'
                                    type="text"
                                    name={`${type}Prefix`}
                                    value={dataObj?.[`${type}Prefix`] || ""}
                                    onChange={changeData}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="d-flex justify-content-between">
                    {(["Department", "Position"].includes(type)) && (
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Company</p>
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
                        </div>
                    )}
                    {type === "Project" && (
                        <>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Team:</p>
                                    <SelectPicker
                                        data={teams}
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        placeholder="Select Team"
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Color:</p>
                                    <input
                                        className="form-control form-control-color"
                                        type="color"
                                        name={`${type}Color`}
                                        value={dataObj?.[`${type}Color`] || ""}
                                        onChange={changeData}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="d-flex justify-content-between">
                    <div className="col-full">
                        <div className="modelInput">
                            <p className='modelLabel'>Employees:</p>
                            <SelectPicker
                                data={emps}
                                size="lg"
                                appearance='default'
                                style={{ width: "100%" }}
                                placeholder="Select Employees"
                            />
                        </div>
                    </div>
                </div>
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
