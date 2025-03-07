import React, { useEffect, useState } from 'react';
import "../Settings/SettingsStyle.css";
import { Modal, Button, SelectPicker, TagPicker, Input, DateRangePicker, InputNumber } from 'rsuite';
import TextEditor from '../payslip/TextEditor';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import "../projectndTask.css";
import { MultiCascader, VStack } from 'rsuite';
// import { TimePicker } from 'rsuite';

const CommonModel = ({
    dataObj,
    editData,
    team_member,
    changeData,
    isAddData,
    addData,
    leads,
    heads,
    managers,
    previewList,
    modifyData,
    projects,
    departments,
    employees,
    deleteData,
    removeState,
    comps,
    changeState,
    toggleAssignEmp,
    removeAttachment,
    type // New prop to determine if it's for "department" or "position"
}) => {
    const [confirmationTxt, setConfirmationTxt] = useState("");
    const [isDisabled, setIsDisabled] = useState(true);

    console.log();

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
                    (["Department", "Position", "Project", "Report", "Report View", "Country", "Edit Country", "Project View", "Team"].includes(type)) &&
                    <div className="d-flex justify-content-between">
                        {
                            ["Department", "Position", "Project", "Report", "Report View", "Country", "Edit Country", "Team"].includes(type) &&
                            <div className={`${type === "Team" ? "col-full" : "col-half"}`}>
                                <div className="modelInput">
                                    <p className='modelLabel'>{type} Name: </p>
                                    <Input required
                                        name={`name`}
                                        value={dataObj?.[type === "Department" ? "DepartmentName" : type === "Position" ? "PositionName" : type === "Team" ? "teamName" : `name`] || ""}
                                        disabled={["Report View", "Project View"].includes(type) ? true : false}
                                        onChange={!["Report View", "Project View"].includes(type) ? (e) =>
                                            changeData(e, type === "Department" ? "DepartmentName" : type === "Position" ? "PositionName" : type === "Team" ? "teamName" : "name") : null}
                                    />
                                </div>
                            </div>
                        }
                        {
                            ["Country", "Edit Country"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Icon:</p>
                                    <Input required
                                        name={`icon`}
                                        // disabled={type === "Project View" ? true : false}
                                        value={dataObj?.[`icon`] || ""}
                                        onChange={(e) => changeData(e.toUpperCase(), "icon")} />
                                </div>
                            </div>
                        }
                        {["Project"].includes(type) && (
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>{type === "Project" ? "Prefix" : "Icon"}:</p>
                                    <Input required
                                        name={`prefix`}
                                        disabled={type === "Project View" ? true : false}
                                        value={dataObj?.[`prefix`] || ""}
                                        onChange={!["Project View"].includes(type) ? (e) => changeData(e.toUpperCase(), "prefix") : null} />
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

                        {["Task", "Task View", "Announcement"].includes(type) && <div className={type === "Announcement" ? "col-full" : "col-half"}>
                            <div className="modelInput">
                                <p className='modelLabel'>Title: </p>
                                <Input required
                                    name={`title`}
                                    disabled={type === "Task View" ? true : false}
                                    value={dataObj?.[`title`] || ""}
                                    onChange={type !== "Task View" ? (e) => changeData(e, "title") : null}
                                />
                            </div>
                        </div>}

                        {["Task", "Task View"].includes(type) && <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Project:</p>
                                <SelectPicker
                                    required
                                    data={projects}
                                    size="lg"
                                    disabled={type === "Task View" ? true : false}
                                    appearance='default'
                                    style={{ width: "100%" }}
                                    placeholder="Select Project"
                                    value={dataObj?.project}
                                    onChange={type !== "Task View" ? (e) => changeData(e, "project") : null}
                                />
                            </div>
                        </div>}
                    </div>

                    {["Task", "Task View"].includes(type) &&
                        <div className="col-full">
                            <div className="modelInput">
                                <p className="modelLabel">Attachments: </p>
                                <input type="file" disabled={type === "Task View" ? true : false} className='form-control' onChange={(e) => changeData(e, "attachments")} multiple={true} />
                            </div>
                            {
                                previewList?.length > 0 ?
                                    previewList.map((imgFile, index) => {
                                        return <div key={index} style={{ display: 'inline-block', margin: '10px', position: 'relative' }}>
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
                                                className='remBtn'
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    }) : dataObj?.attachments?.length > 0 &&
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
                                            {
                                                type !== "Task View" &&
                                                <button
                                                    onClick={() => removeAttachment(imgFile)}
                                                    className='remBtn'
                                                >
                                                    &times;
                                                </button>
                                            }
                                        </div>
                                    ))
                            }
                        </div>}
                </>

                {["Task", "Task View", "Report", "Report View", "Announcement"].includes(type) && (
                    <div className="d-flex justify-content-between">
                        {/* Dynamic fields for Start Date / From */}
                        <div className="col-half">
                            <div className="modelInput">
                                <p className="modelLabel">{type === "Task" ? "From" : "Start Date"}</p>
                                <DatePicker
                                    showTimeSelect={type === "Announcement"}
                                    dateFormat={type === "Announcement" ? "Pp" : "yyyy-MM-dd"} // Added valid default format
                                    className="rsuite_input"
                                    disabled={["Report View", "Task View"].includes(type)}
                                    style={{ width: "100%" }}
                                    placeholder={`Select ${type === "Task" ? "From Date" : "Start Date"}`}
                                    selected={
                                        dataObj?.from
                                            ? new Date(dataObj.from)
                                            : dataObj?.startDate
                                                ? new Date(dataObj.startDate)
                                                : null
                                    }
                                    minDate={new Date()}
                                    onChange={
                                        ["Report View", "Task View"].includes(type)
                                            ? null
                                            : (e) => changeData(e, type === "Task" ? "from" : "startDate")
                                    }
                                />
                            </div>
                        </div>

                        {/* Dynamic fields for End Date / To */}
                        <div className="col-half">
                            <div className="modelInput">
                                <p className="modelLabel">To:</p>
                                <DatePicker
                                    showTimeSelect
                                    className="rsuite_input"
                                    style={{ width: "100%" }}
                                    disabled={["Report View", "Task View"].includes(type)}
                                    minDate={new Date()}
                                    placeholder="Select Due Date"
                                    selected={
                                        dataObj?.to
                                            ? new Date(dataObj.to)
                                            : dataObj?.endDate
                                                ? new Date(dataObj.endDate)
                                                : null
                                    }
                                    onChange={
                                        ["Report View", "Task View"].includes(type)
                                            ? null
                                            : (e) => changeData(e, type === "Task" ? "to" : "endDate")
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-between gap-2">
                    {(["Department", "Position", "Project", "Report", "Report View", "Project View"].includes(type)) && (
                        <>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Company:</p>
                                    <SelectPicker
                                        required
                                        data={comps}
                                        size="lg"
                                        disabled={["Report View", "Project View"].includes(type) ? true : false}
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
                            ["Project", "Task", "Task View", "Project View"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Priority:</p>
                                    <SelectPicker
                                        required
                                        data={["Low", "Medium", "High", "Critical"].map((data) => ({ label: data, value: data }))}
                                        size="lg"
                                        disabled={["Task View", "Project View"].includes(type) ? true : false}
                                        appearance='default'
                                        style={{ width: "100%", zIndex: 1 }}
                                        placeholder="Select Priority"
                                        value={dataObj?.priority}
                                        onChange={!["Task View", "Project View"].includes(type) ? (e) => changeData(e, "priority") : null}
                                    />
                                </div>
                            </div>}
                        {
                            ["Task"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Status:</p>
                                    <SelectPicker
                                        required
                                        data={['Pending', 'In Progress', 'Completed', 'On Hold'].map((data) => ({ label: data, value: data }))}
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%", zIndex: 1 }}
                                        placeholder="Select Status"
                                        value={dataObj?.status}
                                        onChange={(e) => changeData(e, "status")}
                                    />
                                </div>
                            </div>
                        }
                        {
                            ["Task"].includes(type) && !dataObj._id &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Est Time:</p>
                                    <InputNumber
                                        size='lg'
                                        placeholder="Select Time"
                                        style={{ width: "100%" }}
                                        value={dataObj?.estTime}
                                        onChange={(e) => changeData(e, "estTime")}
                                        step={0.01}
                                    />
                                </div>
                            </div>
                        }
                        {
                            ["Project", "Project View"].includes(type) &&
                            <div className="col-quat">
                                <div className="modelInput">
                                    <p className='modelLabel'>Color:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45, border: "none" }}
                                        type={"color"}
                                        name={`color`}
                                        disabled={type === "Project View" ? true : false}
                                        value={dataObj?.[`color`] || ""}
                                        appearance='default'
                                        onChange={type !== "Project View" ? (e) => changeData(e, "color") : null}
                                    />
                                </div>
                            </div>
                        }
                    </>
                </div>

                {
                    ["Task"].includes(type) && dataObj._id &&
                    <div className='d-flex justify-content-between gap-2'>
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Est Time:</p>
                                <InputNumber
                                    size='lg'
                                    placeholder="Select Time"
                                    style={{ width: "100%" }}
                                    value={dataObj?.estTime}
                                    onChange={(e) => changeData(e, "estTime")}
                                    step={0.01}
                                />
                            </div>
                        </div>
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel'>Spend time:</p>
                                <InputNumber size='lg' defaultValue={0.00} style={{ width: "100%" }} step={0.01} value={dataObj?.spend?.timeHolder} onChange={(e) => changeData(e, "spend.timeHolder")} />
                            </div>
                        </div>
                    </div>
                }

                {
                    ["Project", "Project View", "Assign", "Task", "Task View", "Task Assign", "Report", "Report View", "Team"].includes(type) && (
                        <div className="d-flex justify-content-between">
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className="modelLabel">
                                        {["Task", "Task Assign"].includes(type) ? "Assign To" : type === "Team" ? "Team Members" : "Employee"}:
                                    </p>

                                    <TagPicker
                                        data={employees}
                                        required
                                        size="lg"
                                        appearance="default"
                                        disabled={["Report View", "Project View"].includes(type) ? true : false}
                                        style={{ width: "100%" }}
                                        placeholder="Select Employees"
                                        value={type.includes("Task") ? dataObj?.assignedTo : dataObj?.employees}
                                        onChange={["Report View", "Task View", "Project View"].includes(type) ? null : (e) =>
                                            changeData(
                                                e,
                                                type.includes("Task") ? "assignedTo" : "employees"
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }
                {
                    type === "Announcement" &&
                    <>
                        <div className="d-flex justify-content-between">
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className="modelLabel">
                                        Team Employes
                                    </p>

                                    <VStack>
                                        <MultiCascader
                                            className="pt-2"
                                            data={team_member}
                                            onChange={(id) => changeData(id, "selectTeamMembers")}
                                            style={{ width: '100%' }}
                                            placeholder="Select team members"
                                            searchable
                                            checkAll
                                        />
                                    </VStack>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between">
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className="modelLabel">
                                        Message
                                    </p>

                                    <TextEditor
                                        handleChange={(e) => changeData(e, "message")}
                                        content={dataObj?.["message"]}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                }

                {
                    ["Project", "Task", "Task View", "Project View"].includes(type) &&
                    <>
                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>Description:</p>
                                <TextEditor
                                    handleChange={!["Task View", "Project View"].includes(type) ? (e) => changeData(e, "description") : null}
                                    content={dataObj?.["description"]}
                                    isDisabled={["Task View", "Project View"].includes(type) ? true : false}
                                />
                            </div>
                        </div>
                    </>
                }

                {
                    ["Company"].includes(type) &&
                    <>
                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Company Name:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`name`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`CompanyName`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "CompanyName")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Postal Code:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"number"}
                                        name={`PostalCode`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`PostalCode`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "PostalCode")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>Address:</p>
                                <Input
                                    required
                                    size="lg"
                                    style={{ width: "100%", height: 45 }}
                                    type={"text"}
                                    name={`Address`}
                                    // disabled={ ? true : false}
                                    value={dataObj?.[`Address`] || ""}
                                    appearance='default'
                                    onChange={(e) => changeData(e, "Address")}
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Email:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"email"}
                                        name={`Email`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`Email`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "Email")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Contact Person:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`ContactPerson`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`ContactPerson`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "ContactPerson")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Contact No:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`ContactNo`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`ContactNo`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "ContactNo")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Website:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`Website`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`Website`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "Website")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Fax No:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`FaxNo`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`FaxNo`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "FaxNo")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Pan No:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`PanNo`}
                                        value={dataObj?.[`PanNo`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "PanNo")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>GST No:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`GSTNo`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`GSTNo`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "GSTNo")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>CIN No:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`CINNo`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`CINNo`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "CINNo")}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                }
                {
                    ["Country", "Edit Country"].includes(type) &&
                    <>
                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Abbriviation:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`abbr`}
                                        // disabled={ ? true : false}
                                        value={dataObj?.[`abbr`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "abbr")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Code:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        max={3}
                                        value={dataObj?.[`code`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "code")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-full">
                            <div className="modelInput position-relative">
                                <p className="modelLabel">
                                    State:
                                </p>

                                <Input
                                    required
                                    size="lg"
                                    style={{ width: "100%", height: 45 }}
                                    type={"text"}
                                    id="stateInput"
                                    name={`state`}
                                    appearance='default'
                                    onChange={(e) => e !== "" ? setIsDisabled(false) : setIsDisabled(true)}
                                />
                                <button className='btn btn-primary addBtn' disabled={isDisabled} onClick={() => {
                                    changeState('state', document.getElementById("stateInput").value)
                                    document.getElementById("stateInput").value = ""
                                    setIsDisabled(true)
                                }}>Add</button>
                                <div className="inputContent">
                                    {
                                        dataObj?.state?.length > 0 &&
                                        dataObj?.state?.map((item) => {
                                            return <span key={item} onClick={() => removeState(item)}>
                                                {item} <CloseRoundedIcon />
                                            </span>
                                        })

                                    }
                                </div>
                            </div>
                        </div>
                    </>
                }
                {
                    type === "Team" &&
                    ["Manager", "Lead", "Head"].map((emp) => {
                        return <div className="modelInput" key={emp}>
                            <p className="modelLabel">
                                {emp}
                            </p>

                            <TagPicker
                                data={emp === "Manager" ? managers : emp === "Lead" ? leads : heads}
                                required
                                size="lg"
                                appearance="default"
                                style={{ width: "100%" }}
                                placeholder={`Select ${emp}`}
                                value={dataObj?.[emp?.toLowerCase()]}
                                onChange={(e) => changeData(e, emp?.toLowerCase())}
                            />
                        </div>
                    })
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
                            <Button
                                onClick={() => {

                                    if (["Company", "Country", "Edit Country"].includes(type)) {
                                        modifyData(dataObj._id || type === "Edit Country" ? "Edit" : "Add");
                                    } else if (type === "Report View") {
                                        modifyData(dataObj._id, "Cancel");
                                    } else {
                                        modifyData();
                                    }
                                }}
                                appearance="default"
                            >
                                {["Report View", "Task View", "Project View"].includes(type) ? "Back" : "Cancel"}
                            </Button>

                            {
                                !["Report View", "Task View", "Project View"].includes(type) && (
                                    <Button
                                        onClick={() => (dataObj?._id || type === "Edit Country" ? editData(dataObj) : addData())}
                                        appearance="primary"
                                        disabled={
                                            ["Project", "Assign", "Task", "Task Assign", "Report", "Company", "Country", "Edit Country", "Announcement", "Team"].includes(type)
                                                ? false
                                                // : (!dataObj?.[`${type}Name`] || !dataObj?.name) ? true
                                                : (["Department", "Position"].includes(type) && dataObj?.company ? false : true)
                                        }
                                    >
                                        {dataObj?._id || type === "Edit Country" ? "Update" : "Save"}
                                    </Button>
                                )
                            }
                        </>
                }
            </Modal.Footer>
        </Modal >
    );
};

export default CommonModel;
