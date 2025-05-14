import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import { EssentialValues } from '../../App';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { toast } from 'react-toastify';
import CommonModel from './CommonModel';
import "../payslip/payslip.css";
import { Input } from 'rsuite';
import { Skeleton } from '@mui/material';

export default function Country() {
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredContries] = useState([]);
    const [countryObj, setcountryObj] = useState({});
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingCountry, setIschangingCountry] = useState(false);
    const [modifyCountry, setModifyCountry] = useState({
        isAdd: false,
        isEdit: false,
        isDelete: false
    });
    const [countryName, setCountryName] = useState("");

    function changeCountry(value, name) {
        setcountryObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    function changeState(name, value) {

        if (countryObj?.state) {
            const isExists = countryObj?.state?.filter((item) => item === value);

            if (isExists?.length < 1) {
                setcountryObj((pre) => ({
                    ...pre,
                    [name]: [...pre?.state, value]
                }))
            }
        } else {
            setcountryObj((pre) => ({
                ...pre,
                state: [...(pre?.state || []), value] // Ensure state is an array before spreading
            }));
        }
    }

    function removeState(value) {
        const removedStates = countryObj?.state.filter((item) => item !== value)
        setcountryObj((pre) => ({
            ...pre,
            ['state']: removedStates
        }))
    }

    function changeCountryOperation(type) {
        if (type === "Edit") {
            if (modifyCountry.isEdit) {
                setcountryObj({})
            }
            setModifyCountry((pre) => ({
                ...pre,
                isEdit: !pre.isEdit
            }))
        } else if (type === "Delete") {
            setModifyCountry((pre) => ({
                ...pre,
                isDelete: !pre.isDelete
            }))
        } else if (type === "Add") {
            if (modifyCountry.isAdd) {
                setcountryObj({})
            }
            setModifyCountry((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        }
    }
    async function updateCountry() {
        setIschangingCountry(true);
        try {
            const res = await axios.put(`${url}/api/country/${countryObj.code}`, countryObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            changeCountryOperation("Edit");
            setcountryObj({})
        } catch (error) {
            toast.error(error.response.data.error)
        }
        setIschangingCountry(false);
    }

    async function addCountry() {
        setIschangingCountry(true);
        try {
            const res = await axios.post(`${url}/api/country`, countryObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            setcountryObj({});
            changeCountryOperation("Add");
        } catch (error) {
            toast.error(error.response.data.error)
            console.log(error);
        }
        setIschangingCountry(false);
    }

    useEffect(() => {
        function filterCountry() {
            if (countryName === "") {
                setCountries(filteredCountries)
            } else {
                setCountries(filteredCountries.filter((country) => country.name.toLowerCase().includes(countryName)))
            }
        }
        filterCountry()
    }, [countryName])

    async function fetchCountryData(code, type) {
        const selectedCountry = countries.filter((item) => item.code === code);
        setcountryObj(selectedCountry[0]);
        changeCountryOperation(type)
    }

    useEffect(() => {
        async function fetchCountries() {
            setIsLoading(true)
            try {
                const res = await axios.get(`${url}/api/country`, {
                    headers: {
                        Authorization: data.token || ""
                    }
                })
                setCountries(res.data);
                setFilteredContries(res.data);
            } catch (error) {
                console.log(error);
            }
            setIsLoading(false);
        }

        fetchCountries()
    }, [modifyCountry.isAdd, data.token, modifyCountry.isEdit])

    return (
        modifyCountry.isAdd ? <CommonModel type="Country" isWorkingApi={isChangingCountry} addData={addCountry} removeState={removeState} dataObj={countryObj} isAddData={modifyCountry.isAdd} changeState={changeState} modifyData={changeCountryOperation} changeData={changeCountry} /> :
            modifyCountry.isEdit ? <CommonModel type="Edit Country" isWorkingApi={isChangingCountry} removeState={removeState} editData={updateCountry} changeState={changeState} dataObj={countryObj} isAddData={modifyCountry.isEdit} modifyData={changeCountryOperation} changeData={changeCountry} /> :
                <div className="dashboard-parent">
                    <div className="d-flex justify-content-between px-2">
                        <h5 className='text-daily'>Country</h5>
                        {/* <div className='col-lg-4 col-4'>
                        </div> */}
                        <div className='d-flex gap-2'>
                            <Input size="lg" appearance="default" onChange={setCountryName} style={{ width: "250px" }} placeholder="Search Country" />
                            <button className='button m-0' onClick={() => changeCountryOperation("Add")} >+ Add Country</button>
                        </div>
                    </div>
                    {
                        isLoading ? <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                            countries?.length > 0 ?
                                <LeaveTable data={countries} fetchData={fetchCountryData} /> :
                                <NoDataFound message={"Countries data not found"} />
                    }
                </div>
    )
}
