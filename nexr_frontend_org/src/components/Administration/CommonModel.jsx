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
    departments,
    employees,
    deleteData,
    comps,
    removeAttachment,
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
                        ["Confirmation", "Report Confirmation"].includes(type) ? "" :
                            dataObj?._id ? `Edit ${type}` : `Add a ${type}`}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {
                    (["Department", "Position", "Project", "Report", "Report View"].includes(type)) &&
                    <div className="d-flex justify-content-between">
                        {
                            ["Department", "Position", "Project", "Report", "Report View"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>{type} Name: </p>
                                    <Input required
                                        name={`name`}
                                        value={dataObj?.[`name`] || ""}
                                        disabled={type === "Report View" ? true : false}
                                        onChange={type !== "Report View" ? (e) => changeData(e, "name") : null}
                                    />
                                </div>
                            </div>
                        }
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
                        {["Report", "Report View"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Depertment:</p>
                                    <SelectPicker
                                        required
                                        data={departments}
                                        size="lg"
                                        disabled={type === "Report View" ? true : false}
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        placeholder="Select Department"
                                        value={dataObj?.department}
                                        onChange={type !== "Report View" ? (e) => changeData(e, "department") : null}
                                    />
                                </div>
                            </div>
                        }
                    </div>
                }

                <>

                    <div className="d-flex justify-content-between">

                        {["Task"].includes(type) && <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Title: </p>
                                <Input required
                                    name={`title`}
                                    value={dataObj?.[`title`] || ""}
                                    onChange={(e) => changeData(e, "title")}
                                />
                            </div>
                        </div>}

                        {type === "Task" && <div className="col-half">
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
                        </div>}
                    </div>

                    {["Task"].includes(type) &&
                        <div className="col-full">
                            <div className="modelInput">
                                <p className="modelLabel">Attachments: </p>
                                <Uploader
                                    fileListVisible={false}
                                    method="post"
                                    onSuccess={(e) => changeData(e.files[0].convertedFile, "attachments")}
                                    action={`${url}/api/upload`}
                                    name="documents"
                                    multiple={true}
                                >
                                    <Button color="primary">Choose +</Button>
                                </Uploader>
                            </div>
                            {
                                dataObj?.attachments?.length > 0 &&
                                dataObj.attachments.map((imgFile, index) => (
                                    <div key={index} style={{ display: 'inline-block', margin: '10px', position: 'relative' }}>
                                        <img
                                            src={imgFile}
                                            width={50}
                                            height={50}
                                            alt="uploaded file"
                                            style={{ borderRadius: '4px' }}
                                        />
                                        {/* Close button */}
                                        <button
                                            onClick={() => removeAttachment(imgFile)}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                backgroundColor: 'red',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            }
                        </div>}
                </>


                {
                    ["Task", "Report", "Report View"].includes(type) && (
                        <div className="d-flex justify-content-between">
                            {/* Dynamic fields for Start Date / From */}
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel">{type === "Task" ? "From" : "Start Date"}</p>
                                    <DatePicker
                                        size="lg"
                                        appearance="default"
                                        disabled={type === "Report View" ? true : false}
                                        style={{ width: "100%" }}
                                        placeholder={`Select ${type === "Task" ? "From Date" : "Start Date"}`}
                                        value={dataObj?.from ? new Date(dataObj?.from) : new Date(dataObj?.startDate)}
                                        onChange={(e) => changeData(e, type === "Task" ? "from" : "startDate")}
                                    />
                                </div>
                            </div>

                            {/* Dynamic fields for End Date / To */}
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel">To:</p>
                                    <DatePicker
                                        size="lg"
                                        appearance="default"
                                        style={{ width: "100%" }}
                                        placeholder="Select Due Date"
                                        value={dataObj?.to ? new Date(dataObj?.to) : new Date(dataObj?.endDate)}
                                        onChange={(e) => changeData(e, type === "Task" ? "to" : "endDate")}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }


                <div className="d-flex justify-content-between gap-2">
                    {(["Department", "Position", "Project", "Report", "Report View"].includes(type)) && (
                        <>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Company:</p>
                                    <SelectPicker
                                        required
                                        data={comps}
                                        size="lg"
                                        disabled={type === "Report View" ? true : false}
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        placeholder="Select Company"
                                        value={dataObj?.company}
                                        onChange={(e) => changeData(e, "company")}
                                    />
                                </div>
                            </div>
                            {
                                ["Report", "Report View"].includes(type) &&
                                <div className="col-half">
                                    <div className="modelInput">
                                        <p className='modelLabel'>Project:</p>
                                        <SelectPicker
                                            required
                                            data={projects}
                                            size="lg"
                                            disabled={type === "Report View" ? true : false}
                                            appearance='default'
                                            style={{ width: "100%" }}
                                            placeholder="Select Project"
                                            value={dataObj?.project}
                                            onChange={type !== "Report View" ? (e) => changeData(e, "project") : null}
                                        />
                                    </div>
                                </div>
                            }
                        </>
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
                    ["Project", "Assign", "Task", "Task Assign", "Report", "Report View"].includes(type) && (
                        <div className="d-flex justify-content-between">
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className="modelLabel">
                                        {["Task", "Task Assign"].includes(type) ? "Assign To" : "Employee"}:
                                    </p>

                                    <TagPicker
                                        data={employees}
                                        required
                                        size="lg"
                                        appearance="default"
                                        disabled={type === "Report View" ? true : false}
                                        style={{ width: "100%" }}
                                        placeholder="Select Employees"
                                        value={type.includes("Task") ? dataObj?.assignedTo : dataObj?.employees}
                                        onChange={type !== "Report View" ? (e) =>
                                            changeData(
                                                e,
                                                type.includes("Task") ? "assignedTo" : "employees"
                                            ) : null
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )
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
                    ["Confirmation", "Task Confirmation", "Report Confirmation"].includes(type) &&
                    <div className='text-center' style={{ color: "#FFD65A" }}>
                        <p>
                            <ErrorOutlineRoundedIcon sx={{ fontSize: "80px" }} />
                        </p>
                        <h2>Delete</h2>
                        {
                            type === "Confirmation" &&
                            <div className="projectBody bg-warning text-dark text-center">
                                <p className='my-2'><b>Are you sure you want to delete this Project</b></p>
                                <p>By deleting this project all its task, invoice and time entries will be deleted.</p>
                            </div>
                        }

                        <Input required placeholder={`Please Type "Delete" to delete this ${type === "Confirmation" ? "Project" : type === "Report Confirmation" ? "Report" : "Task"}`} onChange={setConfirmationTxt} value={confirmationTxt} appearance="default" size='lg' />
                    </div>
                }

            </Modal.Body>

            <Modal.Footer>
                {
                    ["Confirmation", "Task Confirmation", "Report Confirmation"].includes(type) ?
                        <>
                            <Button onClick={modifyData} appearance="default">No</Button>
                            <Button disabled={confirmationTxt === "Delete" ? false : true} onClick={deleteData} appearance="primary">Yes</Button>
                        </> :
                        <>
                            <Button onClick={type === "Report View" ? () => modifyData(dataObj._id, "Cancel") : () => modifyData()} appearance="default">
                                {type === "Report View" ? "Back" : "Cancel"}
                            </Button>
                            {
                                type !== "Report View" &&
                                <Button
                                    onClick={() => dataObj?._id ? editData(dataObj) : addData()}
                                    appearance="primary"
                                    disabled={["Project", "Assign", "Task", "Task Assign", "Report"].includes(type) ? false : !dataObj?.[`${type}Name`] || !dataObj?.[`name`] || ((["Department", "Position"].includes(type)) && !dataObj?.company)}
                                >
                                    {dataObj?._id ? "Update" : "Save"}
                                </Button>
                            }
                        </>
                }
            </Modal.Footer>
        </Modal >
    );
};

export default CommonModel;
