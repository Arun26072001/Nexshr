import React, { useContext, useEffect, useState } from 'react'
import LeaveTable from '../LeaveTable'
import axios from 'axios';
import { fetchCompanies } from '../ReuseableAPI';
import NoDataFound from '../payslip/NoDataFound';
import { toast } from 'react-toastify';
import CommonModel from './CommonModel';
import Loading from '../Loader';
import { EssentialValues } from '../../App';

export default function Company() {
    const url = process.env.REACT_APP_API_URL;
    const [companies, setCompanies] = useState([]);
    const [companyObj, setCompanyObj] = useState({});
    const [isCompanychange, setIsCompanyChange] = useState(false);
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);
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
            setModifyCompany((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        }
    }

    async function deleteCompany(id) {
        try {
            const deleteCom = await axios.delete(`${url}/api/company/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(deleteCom?.data?.message);
            handleCompanyChange();
            changeCompanyOperation("Delete");
        } catch (error) {
            toast.error(error?.response?.data?.error)
        }
    }

    async function addCompany() {
        setIschangingCompany(true);
        try {
            const msg = await axios.post(url + "/api/company", companyObj, {
                headers: {
                    authorization: data.token || ""
                }
            });
            toast.success(msg?.data?.message);
            setCompanyObj({});
            handleCompanyChange();
            changeCompanyOperation("Add");
        } catch (error) {
            return toast.error(error?.response?.data?.error)
        }
        setIschangingCompany(false);
    }

    async function fetchCompanyById(id) {
        try {
            const company = await axios.get(`${url}/api/company/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            setCompanyObj(company.data);
            changeCompanyOperation("Edit");
        } catch (error) {
            console.log(error);
            toast.error(error);
        }
    }

    function changeCompany(value, name) {
        setCompanyObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }


    async function editCompany() {
        setIschangingCompany(true);
        try {
            // Assuming the correct API endpoint for editing a department is '/api/department/${id}'
            const response = await axios.put(`${url}/api/company/${companyObj._id}`, companyObj, {
                headers: {
                    Authorization: data.token || ""
                }
            });

            toast.success(response?.data?.message);
            setCompanyObj({})
            handleCompanyChange()
            changeCompanyOperation("Edit");
        } catch (error) {
            toast.error(error?.response?.data?.error);
        }
        setIschangingCompany(false);
    }

    useEffect(() => {
        async function gettingCompanies() {
            setIsLoading(true);
            try {
                const companyData = await fetchCompanies();
                setCompanies(companyData)
            } catch (error) {
                console.log(error);

            }
            setIsLoading(false)
        }
        gettingCompanies();
    }, [isCompanychange])

    return (
        isLoading ? <Loading height="80vh" /> :
            modifyCompany.isAdd ? <CommonModel type="Company" isWorkingApi={isChangingCompany} modifyData={changeCompanyOperation} addData={addCompany} changeData={changeCompany} dataObj={companyObj} isAddData={modifyCompany.isAdd} /> :
                modifyCompany.isEdit ? <CommonModel type="Company" isWorkingApi={isChangingCompany} modifyData={changeCompanyOperation} addData={addCompany} changeData={changeCompany} dataObj={companyObj} isAddData={modifyCompany.isEdit} editData={editCompany} /> :
                    <div className='dashboard-parent pt-4'>
                        <div className="d-flex justify-content-between px-2">
                            <h5 className='text-daily'>Company</h5>
                            <button className='button m-0' onClick={() => changeCompanyOperation("Add")}>+ Add Company</button>
                        </div>
                        {
                            companies?.length > 0 ?
                                <LeaveTable data={companies} deleteData={deleteCompany} fetchData={fetchCompanyById} />
                                : <NoDataFound message={"Companies data not found"} />
                        }
                    </div>
    )
}
