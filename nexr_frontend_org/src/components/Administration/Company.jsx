import React, { useEffect, useState } from 'react'
import LeaveTable from '../LeaveTable'
import axios from 'axios';
import { fetchCompanies } from '../ReuseableAPI';
import NoDataFound from '../payslip/NoDataFound';
import { toast } from 'react-toastify';
import CommonModel from './CommonModel';
import Loading from '../Loader';

export default function Company() {
    const url = process.env.REACT_APP_API_URL;
    const [companies, setCompanies] = useState([]);
    const [companyObj, setCompanyObj] = useState({});
    const token = localStorage.getItem("token");
    const [isLoading, setIsLoading] = useState(false);
    const [modifyCompany, setModifyCompany] = useState({
        isAdd: false,
        isEdit: false,
        isDelete: false
    })

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
        } else {
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
                    Authorization: token || ""
                }
            });
            toast.success(deleteCom?.data?.message);
            changeCompanyOperation("Delete");
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message)
        }
    }

    async function addCompany() {
        try {
            const msg = await axios.post(url + "/api/company", companyObj, {
                headers: {
                    authorization: token || ""
                }
            });
            toast.success(msg?.data?.message);
            changeCompanyOperation("Add");
        } catch (error) {
            return toast.error(error?.response?.data?.message)
        }
    }

    async function fetchCompanyById(id) {
        try {
            const company = await axios.get(`${url}/api/company/${id}`, {
                headers: {
                    Authorization: token || ""
                }
            });
            setCompanyObj(company.data);
            changeCompanyOperation("Edit")
        } catch (error) {
            console.log(error);
            toast.error(error);
        }
    }

    async function editCompany() {
        try {
            // Assuming the correct API endpoint for editing a department is '/api/department/${id}'
            const response = await axios.put(`${url}/api/company/${companyObj._id}`, companyObj, {
                headers: {
                    Authorization: token || ""
                }
            });

            // Assuming the API response contains a success message
            toast.success(response?.data?.message);
            changeCompanyOperation("Edit");
        } catch (error) {
            // Show an error toast with the message from the API (or a generic error message if not available)
            const errorMessage = error?.response?.data?.message || error.message || "Something went wrong";
            toast.error(errorMessage);
        }
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
    }, [])
    return (
        isLoading ? <Loading /> :
            modifyCompany.isAdd ? <CommonModel type="Company" modifyData={changeCompanyOperation} addData={addCompany} dataObj={companyObj} isAddData={modifyCompany.isAdd} /> :
                modifyCompany.isEdit ? <CommonModel type="Company" modifyData={changeCompanyOperation} addData={addCompany} dataObj={companyObj} isAddData={modifyCompany.isEdit} /> :
                    <div className='dashboard-parent pt-4'>
                        <div className="row">
                            <div className='col-lg-6 col-6'>
                                <h5 className='text-daily'>Company</h5>
                            </div>
                            <div className='col-lg-6 col-6 d-flex gap-2 justify-content-end'>
                                <button className='button m-0' onClick={() => changeCompanyOperation("Add")}>+ Add Company</button>
                            </div>
                        </div>
                        {
                            companies?.length > 0 ?
                                <LeaveTable data={companies} deleteData={deleteCompany} fetchData={fetchCompanyById} />
                                : <NoDataFound message={"Companies data not found"} />
                        }
                    </div>
    )
}
