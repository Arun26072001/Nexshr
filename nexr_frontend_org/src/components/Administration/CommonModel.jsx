import React, { useContext, useState } from 'react';
import "../Settings/SettingsStyle.css";
import { Modal, Button, SelectPicker, TagPicker, Input, InputNumber, InputGroup, Toggle } from 'rsuite';
import TextEditor from '../payslip/TextEditor';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
// import DatePicker from "react-datepicker";
import { DatePicker } from "rsuite";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import "../projectndTask.css";
import { MultiCascader, VStack } from 'rsuite';
import Loading from '../Loader';
import { EssentialValues } from '../../App';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import { calculateTimePattern, formatDate } from '../ReuseableAPI';

const CommonModel = ({
    dataObj,
    editData,
    team_member,
    changeData,
    isAddData, addData, leads, heads, addReminder, removeReminder, managers,
    hrs, admins, previewList, modifyData, notCompletedTasks,
    projects, departments, employees, deleteData, removeState,
    comps, changeState, removeAttachment, isWorkingApi, removePreview,
    preview, countries, states, errorMsg, tasks, type // New prop to determine if it's for "department" or "position"
}) => {
    const { data } = useContext(EssentialValues);
    const [confirmationTxt, setConfirmationTxt] = useState("");
    const [isDisabled, setIsDisabled] = useState(true);
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [remindOn, setRemindOn] = useState(dataObj?.remind?.on ? new Date(dataObj.remind.on) : null);
    const [remindFor, setRemindFor] = useState(dataObj?.remind?.for || "");

    const isButtonDisabled = !(remindOn && remindFor);

    const handleAddReminder = () => {
        addReminder({ on: remindOn, for: remindFor });
        setRemindOn(null);
        setRemindFor("");
    };

    const getAllMemberIds = (data) => {
        let result = [];
        data.forEach(item => {
            if (item.children) {
                result = result.concat(getAllMemberIds(item.children));
            } else if (typeof item.value === 'string') {
                result.push(item.value);
            }
        });
        return result;
    };


    const handleTeamChange = (selectedValues) => {
        const selectedSet = new Set(selectedValues);
        let result = [];

        const collectSelectedIds = (nodes) => {
            nodes.forEach(node => {
                if (node.children) {
                    // If this group or select-all is selected, include all children
                    if (selectedSet.has(node.value)) {
                        result = result.concat(getAllMemberIds([node]));
                    } else {
                        // Otherwise check children
                        collectSelectedIds(node.children);
                    }
                } else {
                    // Leaf node selected
                    if (selectedSet.has(node.value)) {
                        result.push(node.value);
                    }
                }
            });
        };

        collectSelectedIds(team_member);
        const uniqueIds = [...new Set(result)];
        changeData(uniqueIds, "selectTeamMembers");
    };

    return (
        <Modal open={isAddData} size="sm" backdrop="static" onClose={() => {
            if (["Company", "Country", "Edit Country", "Organization", "Email Template"].includes(type)) {
                modifyData(dataObj?._id || type === "Edit Country" ? "Edit" : "Add");
            } else if (type === "Report View") {
                modifyData(dataObj?._id, "Cancel");
            } else if (dataObj?._id && type === "Organization") {
                modifyData("Edit")
            } else if (["MailSettings postmark", "MailSettings nodemailer"].includes(type)) {
                modifyData(dataObj)
            } else if (dataObj?._id && type === "LeaveType") {
                modifyData("Edit")
            } else if (["TimePattern", "WorkPlace"].includes(type) && dataObj?._id) {
                modifyData("Edit")
            } else if (["TimePattern", "WorkPlace", "Email Template"].includes(type) && !dataObj?._id) {
                modifyData("Add")
            } else if (["View TimePattern", "View WorkPlace"].includes(type) && dataObj?._id) {
                modifyData("View")
            }
            else {
                modifyData();
            }
        }}>
            <Modal.Header>
                <Modal.Title>
                    {type === "Assign" ? `Edit ${type}` :
                        ["Confirmation", "Report Confirmation"].includes(type) ? "" :
                            type === "Add Comments" ? "Add Comments" : type === "Edit Comments" ? "Edit Comments" :
                                dataObj?._id ? `Edit ${type}` : `Add a ${type}`}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {
                    (["Department", "Position", "Project", "Report", "Report View", "Country", "Edit Country", "Project View", "Team", "Organization", "LeaveType", "TimePattern", "WorkPlace", "View WorkPlace"].includes(type)) &&
                    <div className="d-flex justify-content-between">
                        {
                            ["Department", "Position", "Project", "Report", "Report View", "Country", "Edit Country", "Team", "TimePattern", "Organization", "LeaveType", "WorkPlace", "View WorkPlace"].includes(type) &&
                            <div className={`${type === "Team" ? "col-full" : "col-half"}`}>
                                <div className="modelInput">
                                    <p className='modelLabel important'>{type} Name: </p>
                                    <Input required
                                        size='lg'
                                        value={dataObj?.[type === "Department" ? "DepartmentName" : type === "Position" ? "PositionName" : type === "Team" ? "teamName" : type === "Organization" ? "orgName" : type === "LeaveType" ? "LeaveName" : type === "TimePattern" ? "PatternName" : ["WorkPlace", "View WorkPlace"].includes(type) ? "CompanyName" : `name`] || ""}
                                        disabled={["Report View", "Project View", "View WorkPlace"].includes(type) ? true : false}
                                        onChange={!["Report View", "Project View", "View WorkPlace"].includes(type) ? (e) =>
                                            changeData(e, type === "Department" ? "DepartmentName" : type === "Position" ? "PositionName" : type === "Team" ? "teamName" : type === "Organization" ? "orgName" : type === "LeaveType" ? "LeaveName" : type === "TimePattern" ? "PatternName" : ["WorkPlace", "View WorkPlace"].includes(type) ? "CompanyName" : "name") : null}
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
                                        size='lg'
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
                                    <p className='modelLabel important'>Depertment:</p>
                                    <SelectPicker
                                        required
                                        data={departments}
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        size="lg"
                                        disabled={type === "Report View" ? true : false}
                                        placeholder="Select Department"
                                        value={dataObj?.department}
                                        onChange={type !== "Report View" ? (e) => changeData(e, "department") : null}
                                    />
                                </div>
                            </div>
                        }
                        {
                            type === "Organization" &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel important'>EntendValidity:</p>
                                    <InputNumber size='lg' defaultValue={0} style={{ width: "100%" }} step={1} value={dataObj?.entendValidity} onChange={(e) => changeData(e, "entendValidity")} />
                                </div>
                            </div>
                        }
                        {
                            type === "LeaveType" &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel important'>LimitDays:</p>
                                    <InputNumber size='lg' defaultValue={0} style={{ width: "100%" }} step={1} value={dataObj?.limitDays} onChange={(e) => changeData(e, "limitDays")} />
                                </div>
                            </div>
                        }
                        {
                            ["TimePattern", "View TimePattern"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel important'>Default Pattern:</p>
                                    <Toggle checked={dataObj?.DefaultPattern} onChange={(e) => changeData(e, "DefaultPattern")} />
                                </div>
                            </div>
                        }
                        {
                            ["WorkPlace", "View WorkPlace"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel important'>Postcode:</p>
                                    <InputNumber size='lg' value={dataObj?.PostCode} onChange={(e) => changeData(e, "PostCode")} disabled={type === "View WorkPlace"} />
                                </div>
                            </div>
                        }
                    </div>
                }

                <>
                    <div className="d-flex justify-content-between">
                        {["Task", "Task View", "Announcement", "Add Comments", "Email Template"].includes(type) && <div className={["Announcement"].includes(type) ? "col-full" : "col-half"}>
                            <div className="modelInput">
                                <p className='modelLabel important'>Title: </p>
                                <Input required
                                    name={`title`}
                                    size="lg"
                                    disabled={["Task View", "Add Comments"].includes(type) ? true : false}
                                    value={dataObj?.[`title`] || ""}
                                    onChange={type !== "Task View" ? (e) => changeData(e, "title") : null}
                                />
                                {errorMsg?.includes("title") && <p className='text-danger'>{errorMsg}</p>}
                            </div>
                        </div>}

                        {
                            ["Email Template"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel important'>Status:</p>
                                    <Toggle checked={dataObj?.status} onChange={(e) => changeData(e, "status")} />
                                </div>
                            </div>
                        }

                        {
                            ["Add Comments"].includes(type) &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Spend time:</p>
                                    <InputNumber size='lg' defaultValue={0.00} style={{ width: "100%" }} step={0.01} value={dataObj?.comments[0]?.["spend"]} onChange={(e) => changeData(e, "comments.spend")} />
                                </div>
                            </div>
                        }
                        {
                            type === "Edit Comments" &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Spend time:</p>
                                    <InputNumber size='lg' defaultValue={0.00} style={{ width: "100%" }} step={0.01} value={dataObj?.spend} onChange={(e) => changeData(e, "spend")} />
                                </div>
                            </div>
                        }

                        {["Task", "Task View"].includes(type) && <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel important'>Project:</p>
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

                    {["Task", "Task View", "Add Comments", "Edit Comments", "Organization", "Company"].includes(type) && (
                        <div className="col-full">
                            <div className="modelInput">
                                <p className={`modelLabel ${!["Task", "Task View", "Add Comments", "Edit Comments"].includes(type) ? "important" : ""}`}>{type === "Organization" ? "OrgImage" : type === "Company" ? "Logo" : "Attachments"}: </p>
                                <input
                                    type="file"
                                    disabled={type === "Task View"}
                                    className="form-control"
                                    onChange={(e) => changeData(e, type === "Add Comments" ? `comments.attachments` : type === "Organization" ? "orgImg" : type === "Company" ? "logo" : "attachments")}
                                    multiple={!["Organization", "Company"].includes(type)}
                                />
                            </div>

                            {/* Display preview images */}
                            {previewList?.length > 0 || preview ? (
                                <div className='d-flex align-items-center justify-content-center'>

                                    {
                                        ["Organization", "Company"].includes(type) ? <div className="position-relative">
                                            <img
                                                src={preview}
                                                className="w-25 h-auto"
                                                alt="uploaded file"
                                                style={{ borderRadius: "4px" }}
                                            /> {
                                                type !== "Company" &&
                                                <button onClick={() => removePreview()} className="remBtn">
                                                    &times;
                                                </button>
                                            }
                                        </div>
                                            :
                                            previewList?.length &&
                                            previewList?.map((imgFile, index) => (
                                                <div className="col-lg-4 p-2" key={index}>
                                                    <div className="position-relative">
                                                        {(dataObj?.attachments?.length === previewList?.length && dataObj?.attachments[index]?.type === "video/mp4" || imgFile.includes(".mp4")) ?
                                                            <video className="w-100 h-auto" controls>
                                                                <source src={imgFile} type={dataObj?.attachments[index].type} />
                                                            </video> :
                                                            <img
                                                                src={imgFile}
                                                                className="w-100 h-auto"
                                                                alt="uploaded file"
                                                                style={{ borderRadius: "4px" }}
                                                            />}
                                                        <button onClick={() => removeAttachment(imgFile, index)} className="remBtn">
                                                            &times;
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                </div>
                            ) : (
                                <>
                                    {/* Attachments from dataObj */}
                                    {type === "Add Comments"
                                        ? dataObj?.comments?.[0]?.attachments?.length > 0
                                        : dataObj?.attachments?.length > 0
                                            ? (dataObj?.comments?.[0]?.attachments ?? dataObj?.attachments)?.map((imgFile, index) => (
                                                <div key={index} className="col-lg-4 p-2" >
                                                    <div className="position-relative">
                                                        {
                                                            (dataObj?.comments?.[0]?.attachments?.length === previewList?.length && dataObj?.comments?.[0]?.attachments[index].type === "video/mp4") ?
                                                                <video
                                                                    className="w-100 h-auto"
                                                                    controls>
                                                                    <source src={imgFile} type={dataObj?.attachments[index]?.type} />
                                                                </video> :
                                                                <img
                                                                    className="w-100 h-auto"
                                                                    src={imgFile}
                                                                    alt="uploaded file"
                                                                    style={{ borderRadius: "4px" }}
                                                                />
                                                        }
                                                        {/* Close button */}
                                                        <button onClick={() => removeAttachment(imgFile, index)} className="remBtn">
                                                            &times;
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                            : null}
                                </>
                            )}
                        </div>
                    )}
                </>

                {["Task", "Task View", "Report", "Report View", "Announcement"].includes(type) && (
                    <div className="d-flex justify-content-between">
                        {/* Dynamic fields for Start Date / From */}
                        <div className="col-half">
                            <div className="modelInput">
                                <p className="modelLabel important">{type === "Task" ? "From" : "Start Date"}</p>
                                <DatePicker
                                    size={"lg"}
                                    showTimeSelect={["Announcement", "Task", "Report"].includes(type)}
                                    format={["Announcement", "Task", "Report"].includes(type) ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"} // Added valid default format
                                    style={{ width: "100%" }}
                                    disabled={["Report View", "Task View"].includes(type)}
                                    placeholder={`Select ${type === "Task" ? "From Date" : "Start Date"}`}
                                    value={
                                        dataObj?.from
                                            ? new Date(dataObj?.from)
                                            : dataObj?.startDate
                                                ? new Date(dataObj?.startDate)
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
                                <p className="modelLabel important">To:</p>
                                <DatePicker
                                    size={"lg"}
                                    showTimeSelect={["Announcement", "Task", "Report"].includes(type)}
                                    style={{ width: "100%" }}
                                    format={["Announcement", "Task", "Report"].includes(type) ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
                                    disabled={["Report View", "Task View"].includes(type)}
                                    minDate={new Date()}
                                    placeholder="Select Due Date"
                                    value={
                                        dataObj?.to
                                            ? new Date(dataObj?.to)
                                            : dataObj?.endDate
                                                ? new Date(dataObj?.endDate)
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
                                    <p className='modelLabel important'>Company:</p>
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
                                        <p className='modelLabel important'>Project:</p>
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
                                    <p className='modelLabel important'>Priority:</p>
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
                                    <p className='modelLabel important'>Status:</p>
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
                            ["Task"].includes(type) && !dataObj?._id &&
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel important'>Est Time:</p>
                                    <InputNumber
                                        size='lg'
                                        placeholder="Select Time"
                                        style={{ width: "100%" }}
                                        value={(new Date(String(dataObj?.to)) - new Date(String(dataObj?.from))) / (1000 * 60 * 60) || 0}
                                        disabled={true}
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
                                    <p className='modelLabel important'>Color:</p>
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
                    ["Task"].includes(type) && dataObj?._id &&
                    <div className='d-flex justify-content-between gap-2'>
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel important'>Est Time:</p>
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
                    ["Project", "Project View", "Assign", "Task Assign", "Report", "Report View", "Team", "WorkPlace", "View WorkPlace"].includes(type) && (
                        <div className="d-flex justify-content-between">
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className="modelLabel important">
                                        {type === "Team" ? "Team Members" : "Employee"}:
                                    </p>

                                    <TagPicker
                                        data={employees}
                                        required
                                        size="lg"
                                        defaultValue={[data._id]}
                                        appearance="default"
                                        disabled={["Report View", "Project View", "View WorkPlace"].includes(type) ? true : false}
                                        style={{ width: "100%" }}
                                        placeholder="Select Employees"
                                        value={type.includes("Task") ? dataObj?.assignedTo : dataObj?.employees}
                                        onChange={["Report View", "Task View", "Project View"].includes(type) ? null : (e) =>
                                            changeData(e, "employees")
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    ["Task", "Task View"].includes(type) &&
                    ["assignedTo", "participants", "observers"].map((field) => (
                        <div className="d-flex justify-content-between" key={field}>
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className={`modelLabel ${field === "assignedTo" ? "important" : ""}`}>
                                        {field[0].toUpperCase() + field.slice(1)}
                                    </p>

                                    <TagPicker
                                        data={employees}
                                        required
                                        size="lg"
                                        defaultValue={field === "assignedTo" ? [data._id] : []}
                                        appearance="default"
                                        disabled={["Task View"].includes(type)}
                                        style={{ width: "100%" }}
                                        value={dataObj?.[field]}
                                        onChange={
                                            ["Task View"].includes(type) ? null : (e) => changeData(e, field)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                }

                {
                    ["Announcement", "Add Comments", "Edit Comments"].includes(type) &&
                    <>
                        {
                            type === "Announcement" &&
                            <div className="d-flex justify-content-between">
                                <div className="col-full">
                                    <div className="modelInput">
                                        <p className="modelLabel important">
                                            Team Employes
                                        </p>

                                        <VStack>
                                            <MultiCascader
                                                className="pt-2"
                                                data={team_member}
                                                onChange={handleTeamChange}
                                                valueType="all" // 🔥 makes 'select-all' and group values appear in selection
                                                style={{ width: '100%' }}
                                                placeholder="Select team members"
                                                searchable
                                                checkAll
                                            />



                                        </VStack>
                                    </div>
                                </div>
                            </div>
                        }
                        <div className="d-flex justify-content-between">
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className={`modelLabel ${type === "Announcement" ? "important" : ""}`}>
                                        {type === "Announcement" ? "Message" : "Comments"}
                                    </p>

                                    <TextEditor
                                        handleChange={(e) => changeData(e, type === "Announcement" ? "message" : type === "Edit Comments" ? "comment" : "comments.comment")}
                                        content={type === "Add Comments" ? dataObj?.comments[0]?.["comment"] : type === "Edit Comments" ? dataObj?.["comment"] : dataObj?.["message"]}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                }

                {

                    ["Email Template"].includes(type) &&
                    <>
                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>Subject:</p>
                                <Input type='text' size='lg' onChange={(e) => changeData(e, "subject")} value={dataObj?.subject} />
                            </div>
                        </div>
                    </>
                }

                {
                    ["Project", "Task", "Task View", "Project View", "Email Template"].includes(type) &&
                    <>
                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>{type === "Email Template" ? "Content" : "Description"}:</p>
                                <TextEditor
                                    handleChange={!["Task View", "Project View"].includes(type) ? (e) => changeData(e, type === "Email Template" ? "content" : "description") : null}
                                    content={dataObj?.[type === "Email Template" ? "content" : "description"]}
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
                                <div className="modelInput important">
                                    <p className='modelLabel'>Company Name:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        name={`name`}
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
                                <p className='modelLabel important'>Address:</p>
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
                                    <p className='modelLabel important'>Email:</p>
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
                    <div className="d-flex justify-content-between gap-2">
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel Abbriviation'>Abbriviation:</p>
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
                                <p className='modelLabel important'>Code:</p>
                                <InputNumber
                                    required
                                    size="lg"
                                    style={{ width: "100%", height: 45 }}
                                    max={3}
                                    value={dataObj?.[`code`] || ""}
                                    appearance='default'
                                    onChange={(e) => changeData(e, "code")}
                                />
                            </div>
                        </div>
                    </div>}
                {
                    ["Country", "Edit Country", "Email Template"].includes(type) &&
                    <div className="col-full">
                        <div className="modelInput position-relative">
                            <p className="modelLabel">
                                {type === "Email Template" ? "Short Tags" : "State"}:
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
                                changeState(type === "Email Template" ? "shortTags" : 'state', document.getElementById("stateInput").value)
                                document.getElementById("stateInput").value = ""
                                setIsDisabled(true)
                            }}>Add</button>
                            <div className="inputContent">
                                {
                                    dataObj?.shortTags && dataObj?.shortTags.length > 0 ? (
                                        dataObj?.shortTags?.map((item) => (
                                            <span key={item} onClick={() => removeState(item)}>
                                                {item} <CloseRoundedIcon />
                                            </span>
                                        ))
                                    ) : (
                                        dataObj?.state?.map((item) => (
                                            <span key={item} onClick={() => removeState(item)}>
                                                {item} <CloseRoundedIcon />
                                            </span>
                                        ))
                                    )
                                }

                            </div>
                        </div>
                    </div>
                }
                {
                    type === "Team" &&
                    ["Manager", "Lead", "Head", "Admin", "Hr"].map((emp) => {
                        return <div className="modelInput" key={emp}>
                            <p className="modelLabel">
                                {emp}
                            </p>

                            <TagPicker
                                data={emp === "Manager" ? managers : emp === "Lead" ? leads : emp === "Admin" ? admins : emp === "Hr" ? hrs : heads}
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
                                <p className='my-2'><b>Are you sure you want to delete this data</b></p>
                                <p>By deleting this data all its item, invoice and time entries will be deleted.</p>
                            </div>
                        }
                        <Input required placeholder={`Please Type "Delete" to delete this ${type === "Confirmation" ? "Project" : type === "Report Confirmation" ? "Report" : "Task"}`} onChange={setConfirmationTxt} value={confirmationTxt} appearance="default" size='lg' />
                    </div>
                }
                {
                    type === "Organization" &&
                    <>
                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>User Name:</p>
                                <Input
                                    required
                                    size="lg"
                                    style={{ width: "100%", height: 45 }}
                                    type={"name"}
                                    value={dataObj?.[`name`] || ""}
                                    appearance='default'
                                    onChange={(e) => changeData(e, "name")}
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
                                        value={dataObj?.[`email`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "email")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Password:</p>
                                    <InputGroup inside size='lg' style={{ width: "100%", height: 45 }}>
                                        <Input
                                            required
                                            size="lg"
                                            // style={{ width: "100%", height: 45 }}
                                            type={isShowPassword ? "text" : "password"}
                                            value={dataObj?.[`password`] || ""}
                                            appearance='default'
                                            onChange={(e) => changeData(e, "password")}
                                        />
                                        <InputGroup.Button style={{ height: 43 }} onClick={() => setIsShowPassword(!isShowPassword)}>
                                            {isShowPassword ? <VisibilityOffOutlinedIcon /> : <RemoveRedEyeOutlinedIcon />}
                                        </InputGroup.Button>
                                    </InputGroup>
                                </div>
                            </div>
                        </div>
                    </>
                }
                {
                    ["MailSettings nodemailer", "MailSettings postmark"].includes(type) &&
                    <>
                        <div className="d-flex justify-content-between gap-2">
                            <div className={`${type === "MailSettings postmark" ? "col-full" : "col-half"}`}>
                                <div className="modelInput">
                                    <p className='modelLabel'>Service:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        disabled={true}
                                        value={dataObj?.[`service`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "service")}
                                    />
                                </div>
                            </div>
                            {
                                type === "MailSettings nodemailer" &&
                                <div className="col-half">
                                    <div className="modelInput">
                                        <p className='modelLabel'>Mail Host:</p>
                                        <Input
                                            required
                                            size="lg"
                                            type={"text"}
                                            value={dataObj?.[`mailHost`] || ""}
                                            appearance='default'
                                            onChange={(e) => changeData(e, "mailHost")}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                        {
                            type === "MailSettings nodemailer" &&
                            <div className="d-flex justify-content-between gap-2">
                                <div className="col-half">
                                    <div className="modelInput">
                                        <p className='modelLabel'>Mail Port:</p>
                                        <InputNumber
                                            required
                                            size="lg"
                                            style={{ width: "100%", height: 45 }}
                                            value={dataObj?.[`mailPort`] || ""}
                                            appearance='default'
                                            onChange={(e) => changeData(e, "mailport")}
                                        />
                                    </div>
                                </div>
                                <div className="col-half">
                                    <div className="modelInput">
                                        <p className='modelLabel'>Mail Password:</p>
                                        <Input
                                            required
                                            size="lg"
                                            type={"text"}
                                            value={dataObj?.[`mailPassword`] || ""}
                                            appearance='default'
                                            onChange={(e) => changeData(e, "mailPassword")}
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>From Mail:</p>
                                    <Input
                                        required
                                        size="lg"
                                        style={{ width: "100%", height: 45 }}
                                        type={"text"}
                                        value={dataObj?.[`fromEmail`] || ""}
                                        appearance='default'
                                        onChange={(e) => changeData(e, "fromEmail")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>IsActive:</p>
                                    <SelectPicker
                                        required
                                        data={["true", "false"].map((data) => ({ label: data, value: data }))}
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%", zIndex: 1 }}
                                        value={String(dataObj?.isActive)}
                                        onChange={(e) => changeData(e, "isActive")}
                                    />
                                </div>
                            </div>
                        </div>
                        {
                            type === "MailSettings postmark" &&
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className='modelLabel'>API token:</p>
                                    <Input
                                        required
                                        size="lg"
                                        appearance='default'
                                        style={{ width: "100%", zIndex: 1 }}
                                        value={dataObj?.apiToken}
                                        onChange={(e) => changeData(e, "apiToken")}
                                    />
                                </div>
                            </div>
                        }
                    </>
                }
                {
                    type === "LeaveType" &&
                    <div className="col-full">
                        <div className="modelInput">
                            <p className='modelLabel'>Leave Type Description</p>
                            <Input
                                required
                                size="lg"
                                appearance='default'
                                style={{ width: "100%", zIndex: 1 }}
                                value={dataObj?.Description}
                                onChange={(e) => changeData(e, "Description")}
                            />
                        </div>
                    </div>
                }
                {
                    ["TimePattern", "View TimePattern"].includes(type) &&
                    <>
                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Starting Time:</p>
                                    <DatePicker value={new Date(dataObj?.StartingTime)} size='lg' style={{ width: "100%" }} format="HH:mm" onChange={(e) => changeData(e, "StartingTime")} disabled={type === "View TimePattern"} editable={false} />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Finishing Time:</p>
                                    <DatePicker value={new Date(dataObj?.FinishingTime)} size='lg' style={{ width: "100%" }} format="HH:mm" onChange={(e) => changeData(e, "FinishingTime")} disabled={type === "View TimePattern"} editable={false} />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Waiting Time:</p>
                                    <InputNumber size='lg' placeholder='Enter in Minutes' step={0.01} onChange={(e) => changeData(e, "WaitingTime")} disabled={type === "View TimePattern"} value={dataObj?.WaitingTime} />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className='modelLabel'>Break Time:</p>
                                    <InputNumber size='lg' placeholder='Enter in Minutes' step={0.01} onChange={(e) => changeData(e, "BreakTime")} disabled={type === "View TimePattern"} value={dataObj?.BreakTime} />
                                </div>
                            </div>
                        </div>
                        <div className="col-full">
                            <div className="modelInput">
                                <p className='modelLabel'>Weekly Days:</p>
                                <TagPicker
                                    required
                                    data={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((data) => ({ label: data, value: data }))}
                                    size="lg"
                                    disabled={type === "View TimePattern"}
                                    appearance='default'
                                    style={{ width: "100%", zIndex: 1 }}
                                    defaultValue={dataObj?.WeeklyDays}
                                    onChange={(e) => changeData(e, "WeeklyDays")}
                                />
                            </div>
                        </div>
                        {
                            dataObj?.StartingTime && dataObj?.FinishingTime && dataObj?.BreakTime &&
                            <p className="my-2 styleText">
                                <b>{dataObj?.WeeklyDays?.length} working days </b>
                                Selected totalling <b>{(
                                    (dataObj?.WeeklyDays?.length || 0) *
                                    ((calculateTimePattern(dataObj) || 0) - (Number(dataObj?.BreakTime) || 0) / 60)
                                ).toFixed(2)} hrs</b>. excluding breaks
                            </p>
                        }
                        <div className="modelInput d-flex">
                            <p className='modelLabel'>PublicHoliday:</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "stretch", gap: "5px" }}>
                            <div style={{ flex: 1 }}>
                                <div className={`position-relative ${dataObj?.PublicHoliday === "Deducated" ? 'box-content active' : 'box-content'}`} onClick={() => type !== "View TimePattern" ? changeData("Deducated", "PublicHoliday") : null}>
                                    <span className="RadioPosition">
                                        <input type="radio" name="timePattern.PublicHoliday" checked={dataObj?.PublicHoliday === "Deducated"} className="styleRadio" />
                                    </span>
                                    <h6 className="my-2">
                                        Deducated
                                    </h6>

                                    <p className="styleText">
                                        They'll have a day
                                        off any public holidays they would
                                        normally br wokring on and this is
                                        taken from Their yearly holiday
                                        entitlement
                                    </p>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div className={`position-relative ${dataObj?.PublicHoliday === "Not deducated" ? 'box-content active' : 'box-content'}`} onClick={() => type !== "View TimePattern" ? changeData("Not deducated", "PublicHoliday") : null}>
                                    <span className="RadioPosition">
                                        <input type="radio" name="timePattern.PublicHoliday" checked={dataObj?.PublicHoliday === "Not deducated"} className="styleRadio" />
                                    </span>
                                    <h6 className="my-2">
                                        Not Deducated
                                    </h6>

                                    <p className="styleText">
                                        They'll have a day
                                        off any public holidays they would
                                        normally br wokring on and this
                                        will be given on top of their yearly
                                        holiday entitlement
                                    </p>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div className={`position-relative ${dataObj?.PublicHoliday === "works public holidays" ? 'box-content active' : 'box-content'}`} style={{ height: "100%" }} onClick={() => type !== "View TimePattern" ? changeData("works public holidays", "PublicHoliday") : null}>
                                    <span className="RadioPosition">
                                        <input type="radio" name="timePattern.PublicHoliday" checked={dataObj?.PublicHoliday === "works public holidays"} className="styleRadio" />
                                    </span>
                                    <h6 className="my-2">
                                        Works public holidays
                                    </h6>

                                    <p className="styleText">
                                        Public holidays are seen as normal day
                                        and they won't have the day off.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                }
                {
                    ["Task", "Task View"].includes(type) &&
                    <>
                        <div className="d-flex justify-content-between">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel">
                                        SubTasks Of
                                    </p>

                                    <SelectPicker
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        size="lg"
                                        data={tasks?.map((task) => ({ label: task.title + " " + task.status, value: task._id }))}
                                        disabled={type === "Task View"}
                                        value={dataObj?.subTask}
                                        onChange={(value) => changeData(value, "subTask")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel">
                                        Gantt
                                    </p>

                                    <SelectPicker
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        size="lg"
                                        data={notCompletedTasks.map((task) => ({ label: task.title, value: task._id }))}
                                        disabled={type === "Task View"}
                                        value={dataObj?.gantt}
                                        onChange={(value) => changeData(value, "gantt")}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel">Remind about task</p>
                                    <DatePicker
                                        value={remindOn}
                                        onChange={setRemindOn}
                                        size="lg"
                                        style={{ width: "100%" }}
                                        format="yyyy-MM-dd HH:mm"
                                        disabled={type === "Task View"}
                                        editable={false}
                                        id="remindOn"
                                    />
                                </div>
                            </div>

                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel">Remind For</p>
                                    <SelectPicker
                                        appearance="default"
                                        style={{ width: "100%" }}
                                        size="lg"
                                        data={["Assignees", "Creator", "Self"].map((item) => ({ label: item, value: item }))}
                                        disabled={type === "Task View"}
                                        id="remindFor"
                                        value={remindFor}
                                        onChange={setRemindFor}
                                    />
                                </div>
                            </div>

                            <div className="col-quat">
                                <button
                                    className="btn btn-primary"
                                    style={{ height: "fit-content", marginTop: "37px" }}
                                    onClick={handleAddReminder}
                                    disabled={isButtonDisabled}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        <div className="inputContent">
                            {
                                dataObj?.remind && dataObj?.remind?.length > 0 && (
                                    dataObj?.remind?.map((item, index) => (
                                        <span key={index} onClick={() => removeReminder(index)}>
                                            {item.for} {formatDate(new Date(item.on))} <CloseRoundedIcon />
                                        </span>
                                    ))
                                )
                            }

                        </div>
                        <div className="d-flex justify-content-between">
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel">
                                        CRM
                                    </p>

                                    <SelectPicker
                                        appearance='default'
                                        style={{ width: "100%" }}
                                        size="lg"
                                        data={[]}
                                        disabled={type === "Task View"}
                                        value={dataObj?.crm}
                                        onChange={(value) => changeData(value, "crm")}
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="modelInput">
                                    <p className="modelLabel ">
                                        Tags
                                    </p>

                                    <TagPicker
                                        data={[]}
                                        size="lg"
                                        defaultValue={[data._id]}
                                        appearance="default"
                                        disabled={["Task View"].includes(type) ? true : false}
                                        style={{ width: "100%" }}
                                        value={dataObj?.tags}
                                        onChange={["Task View"].includes(type) ? null : (e) => changeData(e, "tags")}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-full">
                            <div className="modelInput">
                                <p className="modelLabel ">
                                    Dependant Tasks
                                </p>
                                <TagPicker
                                    data={tasks.map((task) => ({ label: task.title + " " + task.status, value: task._id }))}
                                    size="lg"
                                    defaultValue={[data._id]}
                                    appearance="default"
                                    disabled={["Task View"].includes(type) ? true : false}
                                    style={{ width: "100%" }}
                                    value={dataObj?.dependantTasks}
                                    onChange={["Task View"].includes(type) ? null : (e) => changeData(e, "dependantTasks")}
                                />
                            </div>
                        </div>
                    </>
                }
                {
                    ["WorkPlace", "View WorkPlace", "Company"].includes(type) &&
                    <>
                        {
                            ["WorkPlace", "View WorkPlace"].includes(type) &&
                            <>
                                <div className="col-full">
                                    <div className="modelInput">
                                        <p className='modelLabel important'>Address_1:</p>
                                        <Input type='text' onChange={(e) => changeData(e, "Address_1")} value={dataObj?.Address_1} disabled={type === "View WorkPlace"} />
                                    </div>
                                </div>
                                <div className="col-full">
                                    <div className="modelInput">
                                        <p className='modelLabel'>Address_2:</p>
                                        <Input type='text' onChange={(e) => changeData(e, "Address_2")} value={dataObj?.Address_2} disabled={type === "View WorkPlace"} />
                                    </div>
                                </div>
                            </>
                        }
                        {
                            ["WorkPlace", "View WorkPlace", "Company"].includes(type) &&
                            <div className="d-flex justify-content-between gap-2">
                                <div className="col-half">
                                    <div className="modelInput">
                                        <p className='modelLabel important'>Country:</p>
                                        <SelectPicker
                                            appearance='default'
                                            style={{ width: "100%" }}
                                            size="lg"
                                            data={countries}
                                            disabled={type === "View WorkPlace"}
                                            labelKey="name"
                                            valueKey="name"
                                            value={dataObj?.Country}
                                            onChange={(value) => changeData(value, "Country")}
                                        />
                                    </div>
                                </div>
                                <div className="col-half">
                                    <div className="modelInput">
                                        <p className='modelLabel important'>State:</p>
                                        <SelectPicker
                                            appearance='default'
                                            style={{ width: "100%" }}
                                            disabled={type === "View WorkPlace"}
                                            size="lg"
                                            data={states}
                                            value={dataObj?.State}
                                            onChange={(value) => changeData(value, "State")}
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                        {
                            ["WorkPlace", "View WorkPlace"].includes(type) &&
                            <div className="col-full">
                                <div className="modelInput">
                                    <p className='modelLabel'>Town:</p>
                                    <Input type='text' onChange={(e) => changeData(e, "Town")} value={dataObj?.Town} disabled={type === "View WorkPlace"} />
                                </div>
                            </div>
                        }
                    </>
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
                                    if (["Company", "Country", "Edit Country", "Organization", "Email Template"].includes(type)) {
                                        modifyData(dataObj?._id || type === "Edit Country" ? "Edit" : "Add");
                                    } else if (type === "Report View") {
                                        modifyData(dataObj?._id, "Cancel");
                                    } else if (dataObj?._id && type === "Organization") {
                                        modifyData("Edit")
                                    } else if (["MailSettings postmark", "MailSettings nodemailer"].includes(type)) {
                                        modifyData(dataObj)
                                    } else if (dataObj?._id && type === "LeaveType") {
                                        modifyData("Edit")
                                    } else if (["TimePattern", "WorkPlace"].includes(type) && dataObj?._id) {
                                        modifyData("Edit")
                                    } else if (["TimePattern", "WorkPlace", "Email Template"].includes(type) && !dataObj?._id) {
                                        modifyData("Add")
                                    } else if (["View TimePattern", "View WorkPlace", "Task View"].includes(type) && dataObj?._id) {
                                        modifyData("View")
                                    }
                                    else {
                                        modifyData();
                                    }
                                }}
                                appearance="default"
                            >
                                {["Report View", "Task View", "Project View"].includes(type) ? "Back" : "Cancel"}
                            </Button>

                            {
                                !["Report View", "Task View", "Project View", "View TimePattern"].includes(type) && (
                                    <Button
                                        onClick={() => ((type === "Add Comments" && dataObj?._id) ? editData(dataObj, true) : dataObj?._id || type === "Edit Country" ? editData(dataObj) : type === "Edit Comments" ? editData() : addData())}
                                        appearance="primary"
                                        disabled={
                                            ["Project", "Assign", "Task", "Task Assign", "Report", "Company", "Country", "Edit Country", "Announcement", "Team", "Add Comments", "TimePattern", "Edit Comments", "Organization", "MailSettings postmark", "MailSettings nodemailer", "LeaveType", "WorkPlace", "Email Template"].includes(type)
                                                ? false : (["Department", "Position"].includes(type) && dataObj?.company ? false : true)
                                        }
                                    >
                                        {isWorkingApi ? <Loading size={20} color='white' /> : type === "Add Comments" ? "Add" : dataObj?._id || type === "Edit Country" || type === "Edit Comments" ? "Update" : "Save"}
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
