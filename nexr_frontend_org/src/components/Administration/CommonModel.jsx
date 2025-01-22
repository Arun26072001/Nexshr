import React, { useState } from 'react';
import "../Settings/SettingsStyle.css";
import { Modal, Button, SelectPicker, TagPicker, Input, DatePicker, Uploader } from 'rsuite';
import TextEditor from '../payslip/TextEditor';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

const CommonModel = ({
    dataObj,
    editData,
    changeData,
    isAddData,
    addData,
    modifyData,
    projects,
    emps,
    deleteData,
    comps,
    type // New prop to determine if it's for "department" or "position"
}) => {
    const url = process.env.REACT_APP_API_URL;
    const [confirmationTxt, setConfirmationTxt] = useState("");
    console.log(dataObj);

    return (
        <Modal open={isAddData} size="sm" backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    {type === "Assign" ? `Edit ${type}` :
                        type === "Confirmation" ? "" :
                            dataObj?._id ? `Edit ${type}` : `Add a ${type}`}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {
                    (["Department", "Position", "Project"].includes(type)) &&
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
                }

                {
                    type === "Task" &&
                    <>
                        <div className="d-flex justify-content-between">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Title: </p>
                                    <Input required
                                        name={`title`}
                                        value={dataObj?.[`title`] || ""}
                                        onChange={(e) => changeData(e, "title")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Project:</p>
                                    <SelectPicker
                                        required
                                        data={projects}
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        placeholder="Select Project"
                                        value={dataObj?.project}
                                        onChange={(e) => changeData(e, "project")}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>From: </p>
                                    <DatePicker
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        placeholder="Select Start Date"
                                        value={dataObj?.from}
                                        onChange={(e) => changeData(e, "from")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>To:</p>
                                    <DatePicker
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        placeholder="Select Due Date"
                                        value={dataObj?.to}
                                        onChange={(e) => changeData(e, "to")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>Attachments: </p>
                                <Uploader method='post' onSuccess={(e) => changeData(e.files[0].convertedFile, "attachments")} action={`${url}/api/upload`} name='documents' multiple={true} fileListVisible={true} >
                                    <Button color='primary'>Choose +</Button>
                                </Uploader>
                            </div>
                        </div>
                    </>
                }

                <div className="d-flex justify-content-between gap-2">
                    {(["Department", "Position", "Project"].includes(type)) && (
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Company:</p>
                                <SelectPicker
                                    required
                                    data={comps}
                                    size="lg"
                                    appearance='default'
                                    style={{ width: "100%" }}
                                    placeholder="Select Company"
                                    value={dataObj?.company}
                                    onChange={(e) => changeData(e, "company")}
                                />
                            </div>
                        </div>
                    )}
                    <>
                        {
                            ["Project", "Task"].includes(type) &&
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
                                        value={dataObj?.priority}
                                        onChange={(e) => changeData(e, "priority")}
                                    />
                                </div>
                            </div>}
                        {
                            type === "Project" &&
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
                        }
                    </>
                </div>

                {
                    ["Project", "Assign", "Task"].includes(type) &&
                    <div className="d-flex justify-content-between">
                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>{type === "Task" ? "Assign To" : "Employee"}:</p>
                                <TagPicker data={emps}
                                    required
                                    size="lg"
                                    appearance='default'
                                    style={{ width: "100%" }}
                                    placeholder="Select Employees"
                                    value={type === "Task" ? dataObj?.assignedTo : dataObj.employees}
                                    onChange={(e) => changeData(e, type === "Task" ? "assignedTo" : "employees")} />
                            </div>
                        </div>
                    </div>
                }

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

                {
                    type === "Confirmation" &&
                    <div className='text-center' style={{ color: "#FFD65A" }}>
                        <p>
                            <ErrorOutlineRoundedIcon sx={{ fontSize: "80px" }} />
                        </p>
                        <h2>Delete</h2>
                        <div className="projectBody bg-warning text-dark text-center">
                            <p className='my-2'><b>Are you sure you want to delete this Project</b></p>
                            <p>By deleting this project all its task, invoice and time entries will be deleted.</p>
                        </div>

                        <Input required placeholder='Please Type "Delete" to delete this Project' onChange={setConfirmationTxt} value={confirmationTxt} appearance="default" size='lg' />
                    </div>
                }

            </Modal.Body>

            <Modal.Footer>
                {
                    type === "Confirmation" ?
                        <>
                            <Button onClick={modifyData} appearance="default">No</Button>
                            <Button disabled={confirmationTxt === "Delete" ? false : true} onClick={deleteData} appearance="primary">Yes</Button>
                        </> :
                        <>
                            <Button onClick={modifyData} appearance="subtle">
                                Close
                            </Button>
                            <Button
                                onClick={dataObj?._id ? editData : addData}
                                appearance="primary"
                                disabled={["Project", "Assign", "Task"].includes(type) ? false : !dataObj?.[`${type}Name`] || !dataObj?.[`name`] || ((["Department", "Position"].includes(type)) && !dataObj?.company)}
                            >
                                {dataObj?._id ? "Update" : "Save"}
                            </Button>
                        </>
                }
            </Modal.Footer>
        </Modal>
    );
};

export default CommonModel;
