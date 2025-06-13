import React, { useContext, useEffect, useState } from 'react'
import LeaveTable from '../LeaveTable'
import axios from 'axios';
import { fetchCompanies, fileUploadInServer } from '../ReuseableAPI';
import NoDataFound from '../payslip/NoDataFound';
import { toast } from 'react-toastify';
import CommonModel from './CommonModel';
import { EssentialValues } from '../../App';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Company() {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const [companies, setCompanies] = useState([]);
    const [companyObj, setCompanyObj] = useState({});
    const [isCompanychange, setIsCompanyChange] = useState(false);
    const { data } = useContext(EssentialValues);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState("");
    const [logoPreview, setLogoPreView] = useState("");
    const [isChangingCompany, setIschangingCompany] = useState(false);
    const [modifyCompany, setModifyCompany] = useState({
        isAdd: false,
        isEdit: false,
        isDelete: false
    })

    function handleCompanyChange() {
        setIsCompanyChange(!isCompanychange);
    }

    function changeCompanyOperation(type) {
        if (type === "Edit") {
            if (modifyCompany.isEdit) {
                setLogoPreView("");
                setCompanyObj({});
            }
            setModifyCompany((pre) => ({
                ...pre,
                isEdit: !pre.isEdit
            }))
        } else if (type === "Delete") {
            setModifyCompany((pre) => ({
                ...pre,
                isDelete: !pre.isDelete
            }))
        } else if (type === "Add") {
            if (modifyCompany.isAdd) {
                setLogoPreView("")
                setCompanyObj({})
            }
            setModifyCompany((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        }
    }

    async function deleteCompany(id) {
        try {
            setIsDeleting(id)
            const deleteCom = await axios.delete(`${url}/api/company/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(deleteCom?.data?.message);
            handleCompanyChange();
            changeCompanyOperation("Delete");
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        } finally {
            setIsDeleting("");
        }
    }

    async function addCompany() {
        setIschangingCompany(true);
        try {
            let updatedCompanyObj = {
                ...companyObj
            };
            // upload company logo
            if (companyObj.logo) {
                const upload = await fileUploadInServer([companyObj.logo]);
                updatedCompanyObj = {
                    ...companyObj,
                    logo: upload.files[0].originalFile
                }
            }
            const msg = await axios.post(url + "/api/company", updatedCompanyObj, {
                headers: {
                    authorization: data.token || ""
                }
            });
            toast.success(msg?.data?.message);
            setCompanyObj({});
            setLogoPreView("");
            handleCompanyChange();
            changeCompanyOperation("Add");
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            return toast.error(error?.response?.data?.error)
        } finally {
            setIschangingCompany(false);
        }
    }

    async function fetchCompanyById(id) {
        try {
            const company = await axios.get(`${url}/api/company/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            setCompanyObj(company.data);
            setLogoPreView(company.data.logo);
            changeCompanyOperation("Edit");
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
            toast.error(error);
        }
    }

    function changeCompany(value, name) {
        if (name === "Country") {
            const selectedcountryOfStates = countries.filter((country) => country.name === value)[0].states.map((state) => ({
                label: state, value: state
            }))
            setStates(selectedcountryOfStates)
        }

        if (name === "logo" && value?.target?.files) {
            setLogoPreView(URL.createObjectURL(value.target.files[0]))
        }
        setCompanyObj((pre) => ({
            ...pre,
            [name]: name === "logo" ? value.target.files[0] : value
        }))
    }

    async function editCompany() {
        setIschangingCompany(true);
        let updatedCompanyObj = {
            ...companyObj
        }
        try {
            if (companyObj?.logo?.type?.includes("image")) {
                const upload = await fileUploadInServer([companyObj.logo]);
                updatedCompanyObj = {
                    ...companyObj,
                    logo: upload.files[0].originalFile
                }
            }
            // Assuming the correct API endpoint for editing a department is '/api/department/${id}'
            const response = await axios.put(`${url}/api/company/${companyObj._id}`, updatedCompanyObj, {
                headers: {
                    Authorization: data.token || ""
                }
            });

            toast.success(response?.data?.message);
            setCompanyObj({})
            setLogoPreView("")
            handleCompanyChange()
            changeCompanyOperation("Edit");
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error);
        } finally {
            setIschangingCompany(false);
        }
    }

    useEffect(() => {
        async function gettingCompanies() {
            setIsLoading(true);
            try {
                const companyData = await fetchCompanies();
                setCompanies(companyData)
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.log(error);

            }
            setIsLoading(false)
        }
        gettingCompanies();
    }, [isCompanychange])

    useEffect(() => {
        async function fetchCountries() {
            try {
                const res = await axios.get(`${url}/api/country`, {
                    headers: {
                        authorization: data.token || ""
                    }
                })
                setCountries(res.data);
            } catch (err) {
                toast.error(err.response.data.error)
            }
        }
        fetchCountries();
    }, [])

    return (
        modifyCompany.isAdd ? <CommonModel type="Company" countries={countries} states={states} preview={logoPreview} isWorkingApi={isChangingCompany} modifyData={changeCompanyOperation} addData={addCompany} changeData={changeCompany} dataObj={companyObj} isAddData={modifyCompany.isAdd} /> :
            modifyCompany.isEdit ? <CommonModel type="Company" preview={logoPreview} countries={countries} states={states} isWorkingApi={isChangingCompany} modifyData={changeCompanyOperation} addData={addCompany} changeData={changeCompany} dataObj={companyObj} isAddData={modifyCompany.isEdit} editData={editCompany} /> :
                <div className='dashboard-parent pt-4'>
                    <div className="d-flex justify-content-between px-2">
                        <h5 className='text-daily'>Company</h5>
                        <button className='button m-0' onClick={() => changeCompanyOperation("Add")}>+ Add Company</button>
                    </div>
                    {
                        isLoading ? <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                            companies?.length > 0 ?
                                <LeaveTable data={companies} deleteData={deleteCompany} isLoading={isDeleting} fetchData={fetchCompanyById} />
                                : <NoDataFound message={"Companies data not found"} />
                    }
                </div>
    )
}
