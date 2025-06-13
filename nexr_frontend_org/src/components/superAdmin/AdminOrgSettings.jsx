import React, { useContext, useEffect, useState } from 'react';
import CommonModel from '../Administration/CommonModel';
import axios from "axios";
import { EssentialValues } from '../../App';
import Loading from '../Loader';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminOrgSettings = ({ organizations }) => {
    const url = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const { data } = useContext(EssentialValues)
    const [mailSettingsObj, setMailSettingsObj] = useState({});
    const [mailSettings, setMailSettings] = useState([]);
    const [isChangeMail, setIsChangeMail] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState("");

    function handleChangeMailSettings() {
        setIsChangeMail(!isChangeMail)
    }

    // Handle input changes
    const handleChange = (value, name) => {
        setMailSettingsObj(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    async function fetchMailSettings() {
        setIsLoading(true)
        try {
            const res = await axios.get(`${url}/api/mail-settings`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setMailSettings(res.data)
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
        } finally {
            setIsLoading(false)
        }
    }

    async function editMailSetting(updatedData) {
        try {
            updatedData = {
                ...updatedData,
                isActive: JSON.parse(updatedData.isActive)
            }
            const res = await axios.put(`${url}/api/mail-settings/${updatedData._id}`, updatedData, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            fetchMailSettings();
            setIsChangeMail(false)
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
        }
    }

    function makeItActive(item) {
        const updatedMailSetting = {
            ...item,
            isActive: !item.isActive
        }
        editMailSetting(updatedMailSetting)
    }

    useEffect(() => {
        fetchMailSettings()
    }, [])

    return (
        isLoading ? <Loading height='100vh' /> :
            isChangeMail ? <CommonModel type={`MailSettings ${type}`} isAddData={isChangeMail} dataObj={mailSettingsObj} modifyData={handleChangeMailSettings} changeData={handleChange} editData={editMailSetting} /> :
                <div className="p-4 w-100">
                    <p className="titleText text-start">Mail Settings</p>
                    <div className="row">
                        {
                            mailSettings.map((item, index) => {
                                return <div className="col-md-6" key={index}>
                                    <div className={`box-content messageCount position-relative cardContent d-block ${item.isActive ? "activeCard" : ""}`} style={{ background: "white", textAlign: "center", height: "100%", boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}>
                                        <span className="RadioPosition" onClick={() => makeItActive(item)}>
                                            <input type="radio" checked={item.isActive} className="styleRadio" style={{ cursor: "pointer" }} />
                                        </span>
                                        <button className='button positioning' onClick={() => {
                                            setMailSettingsObj(item)
                                            handleChangeMailSettings()
                                            setType(item.service)
                                        }}><EditOutlinedIcon /></button>
                                        {
                                            Object.entries(item).map(([key, value]) => {
                                                if (!["__v", "_id", "isActive"].includes(key)) {
                                                    return <div className="d-flex my-1" key={index}>
                                                        <div className="col-lg-5 text-start"><b>{key.toUpperCase()}</b></div>
                                                        <div className="col-lg-5 text-start sub_text " style={{ fontSize: "15px", fontWeight: 600, color: "rgb(150 147 147)" }}>  {value}</div>
                                                    </div>
                                                }
                                            })
                                        }
                                    </div>
                                </div>
                            })
                        }
                    </div>
                </div>
    );
};

export default AdminOrgSettings;
