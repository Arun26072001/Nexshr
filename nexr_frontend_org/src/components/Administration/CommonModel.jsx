import axios from 'axios';
import React, { useEffect, useState } from 'react';
import "../Settings/SettingsStyle.css";
import { Modal, Button, SelectPicker, TagPicker, Input } from 'rsuite';
import TextEditor from '../payslip/TextEditor';

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
            setCompanies(response.data.map((data) => ({ label: data.CompanyName, value: data._id })));
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
                <div className="d-flex justify-content-between">
                    <div className="col-half">
                        <div className="modelInput">
                            <p className='modelLabel'>{type} Name: </p>

                            <Input required
                                name={`name`}
                                value={dataObj?.[`name`] || ""}
                                onChange={(e) => changeData(e, "name")}
                            />
                        </div>
                    </div>
                    {type === "Project" && (
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Prefix:</p>

                                <Input required
                                    name={`prefix`}
                                    value={dataObj?.[`prefix`] || ""}
                                    onChange={(e) => changeData(e.toUpperCase(), "prefix")} />
                            </div>
                        </div>
                    )}
                    {
                        type === "Task"
                    }
                </div>

                <div className="d-flex justify-content-between gap-2">
                    {(["Department", "Position", "Project"].includes(type)) && (
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Company:</p>
                                <SelectPicker
                                    required
                                    data={companies}
                                    size="lg"
                                    appearance='default'
                                    style={{ width: "100%" }}
                                    placeholder="Select Company"
                                    onChange={(e) => changeData(e, "company")}
                                />
                            </div>
                        </div>
                    )}
                    {type === "Project" && (
                        <>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Priority:</p>
                                    <SelectPicker
                                        required
                                        data={["Low", "Medium", "High", "Critical"].map((data) => ({ label: data, value: data }))}
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        placeholder="Select Priority"
                                        onChange={(e) => changeData(e, "priority")}
                                    />
                                </div>
                            </div>
                            <div className="col-quat">
                                <div className="modelInput">
                                    <p className='modelLabel'>Color:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45, border: "none" }}
                                        type={"color"}
                                        name={`color`}
                                        value={dataObj?.[`color`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "color")}
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
                            <TagPicker data={emps}
                                required
                                size="lg"
                                appearance='default'
                                style={{ width: "100%" }}
                                placeholder="Select Employees"
                                onChange={(e) => changeData(e, "employees")} />
                        </div>
                    </div>
                </div>

                {
                    ["Project", "Task"].includes(type) &&
                    <>
                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>Description:</p>
                                <TextEditor handleChange={(e) => changeData(e, "description")} content={dataObj?.["description"]} />
                            </div>
                        </div>
                    </>
                }
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={modifyData} appearance="subtle">
                    Close
                </Button>
                <Button
                    onClick={dataObj?._id ? editData : addData}
                    appearance="primary"

                    disabled={type === "Project" ? false : !dataObj?.[`${type}Name`] || !dataObj?.[`name`] || ((["Department", "Position"].includes(type)) && !dataObj?.company)}
                >
                    {dataObj?._id ? "Update" : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CommonModel;
