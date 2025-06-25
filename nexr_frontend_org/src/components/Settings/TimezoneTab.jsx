import { useEffect } from "react";
import { useState } from "react";
import { Button, Input, Modal, SelectPicker } from "rsuite";
import Loading from "../Loader";
import axios from "axios";
import { useContext } from "react";
import { EssentialValues } from "../../App";
import { toast } from "react-toastify";
import { Skeleton } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { TimerStates } from "../payslip/HRMDashboard";
import NoDataFound from "../payslip/NoDataFound";

export default function TimezoneTab() {
    const { data } = useContext(EssentialValues);
    const { companies } = useContext(TimerStates);
    const { token, _id } = data;
    const [selectedTimeZone, setSelectedTimeZone] = useState({});
    const [isAdd, setIsAdd] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [timeZoneObj, setTimezoneObj] = useState({});
    const [isWorkingApi, setIsWorkingApi] = useState(false);
    const [error, setError] = useState("");
    const [timezoneNames, setTimezoneName] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // cosnt [fulltime]
    const [timeZones, setTimezones] = useState([]);
    const url = process.env.REACT_APP_API_URL;

    function handleEdit() {
        if (isEdit) {
            setTimezoneObj({})
        }
        setIsEdit(!isEdit)
    }

    function handleAdd() {
        if (isAdd) {
            setTimezoneObj({})
        }
        setIsAdd(!isAdd)
    }

    async function addTimezone() {
        try {
            setError("")
            setIsWorkingApi(true)
            const res = await axios.post(`${url}/api/timezone/${_id}`, timeZoneObj, {
                headers: {
                    Authorization: token || ""
                }
            })
            toast.success(res.data.message);
            fetchTimezone()
            handleAdd();
        } catch (error) {
            console.log("erorr in add timezone", error);
            toast.error(error.response.data.error)
            setError(error.response.data.error)
        } finally {
            setIsWorkingApi(false)
        }
    }

    async function updateTimezone() {
        try {
            setError("")
            setIsWorkingApi(true)
            const res = await axios.put(`${url}/api/timezone/${timeZoneObj._id}`, timeZoneObj, {
                headers: {
                    Authorization: token || ""
                }
            })
            toast.success(res.data.message);
            fetchTimezone()
            handleEdit();
        } catch (error) {
            console.log("erorr in update timezone", error);
            toast.error(error.response.data.error)
            setError(error.response.data.error)
        } finally {
            setIsWorkingApi(false)
        }
    }

    function fillTimezoneObj(value, name) {
        setTimezoneObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    async function fetchNameOfTimezone() {
        try {
            const res = await axios.get(`${url}/api/timezone/name`, {
                params: {
                    value: timeZoneObj.name
                },
                headers: {
                    Authorization: token || ""
                }
            })
            setTimezones(res.data.timeZones.map((zone) => ({ label: zone, value: zone })));
        } catch (error) {
            console.log("error in fetch timezone", error);
        }
    }

    useEffect(() => {
        if (timeZoneObj?.name) {
            fetchNameOfTimezone()
        }
    }, [timeZoneObj?.name])

    async function fetchTimezone() {
        try {
            setIsLoading(true)
            const res = await axios.get(`${url}/api/timezone/${_id}`, {
                headers: {
                    Authorization: token || ""
                }
            })
            if (res.data.error) {
                setSelectedTimeZone({})
            } else {
                setSelectedTimeZone(res.data);
            }
        } catch (error) {
            console.log("error in fetch timeZone", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchTimezoneValues() {
        try {
            const res = await axios.get(`${url}/api/timezone/values`, {
                headers: {
                    Authorization: token
                }
            })
            setTimezoneName(res.data.map((name) => ({ label: name, value: name })));
        } catch (error) {
            console.log("error in get timezoneValues", error);
        }
    }

    useEffect(() => {
        fetchTimezoneValues()
        fetchTimezone()
    }, [])

    if (isAdd) {
        return <Modal open={isAdd} size="sm" backdrop="static">
            <Modal.Header >
                <Modal.Title>
                    {timeZoneObj._id ? "Edit a Timezone" : "Add a Timezone"}
                </Modal.Title>
            </Modal.Header >

            <Modal.Body>
                <div className="d-flex justify-content-between gap-2">
                    <div className="col-half">
                        <div className="modelInput"></div>
                        <div className="modelInput">
                            <p className='modelLabel'>Name:</p>
                            <SelectPicker
                                required
                                data={timezoneNames}
                                size="lg"
                                appearance='default'
                                style={{ width: "100%", borderColor: error.includes("name") && "red" }}
                                placeholder="Select timezone Name"
                                value={timeZoneObj.name}
                                onChange={(e) => fillTimezoneObj(e, "name")}
                            />
                            {error.includes("name") && <div className="text-center text-danger">{error}</div>}
                        </div>
                    </div>
                    <div className="col-half">
                        <div className="modelInput">
                            <p className='modelLabel important'>Timezone:</p>
                            <SelectPicker
                                required
                                data={timeZones}
                                size="lg"
                                appearance='default'
                                style={{ width: "100%", borderColor: error.includes("timeZone") && "red" }}
                                placeholder="Select Timezone"
                                value={timeZoneObj?.timeZone}
                                onChange={(e) => fillTimezoneObj(e, "timeZone")}
                            />
                            {error.includes("timeZone") && <div className="text-center text-danger">{error}</div>}
                        </div>
                    </div>
                </div>
                <div className="col-full">
                    <div className="modelInput">
                        <p className='modelLabel important'>Company:</p>
                        <SelectPicker
                            required
                            data={companies}
                            size="lg"
                            appearance='default'
                            style={{ width: "100%", borderColor: error.includes("company") && "red" }}
                            placeholder="Select Company"
                            value={timeZoneObj?.company}
                            onChange={(e) => fillTimezoneObj(e, "company")}
                        />
                        {error.includes("company") && <div className="text-center text-danger">{error}</div>}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <>
                    <Button
                        onClick={() => timeZoneObj._id ? handleEdit() : handleAdd()}
                        appearance="default"
                    >
                        Cancel
                    </Button>

                    {
                        <Button
                            onClick={() => timeZoneObj._id ? updateTimezone() : addTimezone()}
                            appearance="primary"
                        >
                            {isWorkingApi ? <Loading size={20} color='white' /> : timeZoneObj._id ? "Update" : "Save"}
                        </Button>
                    }
                </>
            </Modal.Footer>
        </Modal>
    }
    if (isEdit) {
        return <Modal open={isEdit} size="sm" backdrop="static">
            <Modal.Header >
                <Modal.Title>
                    {timeZoneObj._id ? "Edit a Timezone" : "Add a Timezone"}
                </Modal.Title>
            </Modal.Header >

            <Modal.Body>
                <div className="d-flex justify-content-between gap-2">
                    <div className="col-half">
                        <div className="modelInput"></div>
                        <div className="modelInput">
                            <p className='modelLabel'>Name:</p>
                            <SelectPicker
                                required
                                data={timezoneNames}
                                size="lg"
                                appearance='default'
                                style={{ width: "100%" }}
                                placeholder="Select timezone Name"
                                value={timeZoneObj.name}
                                onChange={(e) => fillTimezoneObj(e, "name")}
                            />
                        </div>
                    </div>
                    <div className="col-half">
                        <div className="modelInput">
                            <p className='modelLabel important'>Timezone:</p>
                            <SelectPicker
                                required
                                data={timeZones}
                                size="lg"
                                appearance='default'
                                style={{ width: "100%" }}
                                placeholder="Select Timezone"
                                value={timeZoneObj?.timeZone}
                                onChange={(e) => fillTimezoneObj(e, "timeZone")}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-full">
                    <div className="modelInput">
                        <p className='modelLabel important'>Company:</p>
                        <SelectPicker
                            required
                            data={companies}
                            size="lg"
                            appearance='default'
                            style={{ width: "100%" }}
                            placeholder="Select Company"
                            value={timeZoneObj?.company}
                            onChange={(e) => fillTimezoneObj(e, "company")}
                        />
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <>
                    <Button
                        onClick={() => timeZoneObj._id ? handleEdit() : handleAdd()}
                        appearance="default"
                    >
                        Cancel
                    </Button>

                    {
                        <Button
                            onClick={() => timeZoneObj._id ? updateTimezone() : addTimezone()}
                            appearance="primary"
                        >
                            {isWorkingApi ? <Loading size={20} color='white' /> : timeZoneObj._id ? "Update" : "Save"}
                        </Button>
                    }
                </>
            </Modal.Footer>
        </Modal>
    }
    return (
        <div className="row">
            <div className="col-6 col-lg-6 col-md-6 d-flex justify-content-start">
                <h5>Timezone</h5>
            </div>
            <div className="col-6 col-lg-6 col-md-6 d-flex justify-content-end">
                <button type="button" onClick={handleAdd} className="button">
                    Add Timezone
                </button>
            </div>
            {
                isLoading ? [...Array(2)].map((_, index) => (<Skeleton variant="rounded" width={"100%"} height={80} key={index} className="my-3" />)) :
                    selectedTimeZone && Object.values(selectedTimeZone).length > 0 ?
                        <div className="px-3">
                            <div className="payslipInfoCard row d-flex justify-content-between align-items-center" >
                                <div className="col-lg-4 text-start">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img
                                            src={selectedTimeZone.company.logo}
                                            alt="Profile"
                                            style={{ width: '50px', height: '50px', objectFit: "cover" }}
                                        />
                                        <span className="payslipTitle">{selectedTimeZone.company.CompanyName}</span>
                                    </div>
                                </div>
                                <div className="col-lg-4 text-center flex-column">
                                    <div style={{ fontSize: "16px", fontWeight: 600 }} >{selectedTimeZone.name}</div>
                                    <div style={{ color: "#92A49F" }}>{selectedTimeZone.timeZone}</div>
                                </div>
                                <div className="col-lg-4 text-end">
                                    <button
                                        className="btn btn-outline-dark me-2"
                                        title="Edit"
                                        onClick={() => {
                                            setTimezoneObj({
                                                ...selectedTimeZone,
                                                company: selectedTimeZone.company._id
                                            })
                                            handleEdit()
                                        }}
                                        aria-label="Edit"
                                    >
                                        <EditRoundedIcon />
                                    </button>
                                    {/* <button
                                        className="btn btn-outline-dark"
                                        title="View"
                                        onClick={() => }
                                        aria-label="View"
                                    >
                                        <VisibilityIcon />
                                    </button> */}
                                </div>
                            </div>
                        </div>
                        : <NoDataFound height={"80vh"} message={"You have not set timezone yet"} />
            }

        </div>
    )
}
