import React, { useContext, useEffect, useState } from "react";
import InfoIcon from '@mui/icons-material/Info';
import "./SettingsStyle.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../Loader";
import NoDataFound from "../payslip/NoDataFound";
import { fetchWorkplace } from "../ReuseableAPI";
import LeaveTable from "../LeaveTable";
import { EssentialValues } from "../../App";
import CommonModel from "../Administration/CommonModel";
import { TimerStates } from "../payslip/HRMDashboard";
import { Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";

const WorkPlaceTab = () => {
  const navigate = useNavigate();
  const url = process.env.REACT_APP_API_URL;
  const [workPlaces, setWorkPlaces] = useState([]);
  const { data } = useContext(EssentialValues);
  const { employees } = useContext(TimerStates);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState("");
  const [workPlaceObj, setWorkPlaceObj] = useState({});
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [isWorkingApi, setIsWorkingApi] = useState(false);
  const [changeWorkplace, setChangeWorkPlace] = useState({
    isAdd: false,
    isEdit: false,
    isView: false
  })

  async function fetchCountries() {
    try {
      const res = await axios.get(`${url}api/country`, {
        headers: {
          authorization: data.token || ""
        }
      })
      setCountries(res.data);
    } catch (err) {
      toast.error(err.response.data.error)
    }
  }

  function handleChangeWorkPlace(type, pattern) {
    if (type === "Add") {
      setChangeWorkPlace((pre) => ({
        ...pre,
        isAdd: !pre.isAdd
      }))
      if (changeWorkplace.isAdd) {
        setWorkPlaceObj({})
      }
    } else if (type === "Edit") {
      if (!changeWorkplace.isEdit) {
        setWorkPlaceObj({
          ...pattern,
          employees: pattern.employees.map((emp) => emp._id)
        })
      }
      setChangeWorkPlace((pre) => ({
        ...pre,
        isEdit: !pre.isEdit
      }))
      if (changeWorkplace.isEdit) {
        setWorkPlaceObj({})
      }
    } else {
      if (!changeWorkplace.isView) {
        setWorkPlaceObj({
          ...pattern,
          employees: pattern.employees.map((emp) => emp._id)
        })
      }
      setChangeWorkPlace((pre) => ({
        ...pre,
        isView: !pre.isView
      }))
      if (changeWorkplace.isView) {
        setWorkPlaceObj({})
      }
    }
  }

  function fetchStateData(value) {
    const stateData = countries.find(country => country.name === value)?.states || [];
    setStates(stateData.map((state) => ({ label: state, value: state })));
  }

  function fillworkplaceObj(value, name) {
    if (name === "Country") {
      fetchStateData(value);
    }
    setWorkPlaceObj((pre) => ({
      ...pre,
      [name]: value?.trimStart()?.replace(/\s+/g, ' ')
    }))
  }

  async function addWorkplace() {
    try {
      setIsWorkingApi(true);
      const res = await axios.post(`${url}api/work-place`, workPlaceObj, {
        headers: {
          Authorization: data.token || ""
        }
      })
      toast.success(res.data.message);
      fetchWorkPlaces();
      setWorkPlaceObj({});
      handleChangeWorkPlace("Add");
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in add workplace:", error);
      toast.error(error?.response?.data?.error)
    } finally {
      setIsWorkingApi(false);
    }
  }

  async function editWorkPlace() {
    try {
      setIsWorkingApi(true);
      const res = await axios.put(`${url}api/work-place/${workPlaceObj._id}`, workPlaceObj, {
        headers: {
          Authorization: data.token || ""
        }
      })
      toast.success(res.data.message);
      setWorkPlaceObj({})
      handleChangeWorkPlace("Edit");
      fetchWorkPlaces();
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in add workplace:", error);
      toast.error(error?.response?.data?.error)
    } finally {
      setIsWorkingApi(false);
    }
  }

  async function deleteWorkplace(workPlaceId) {
    try {
      setIsDeleting(workPlaceId)
      const res = await axios.delete(`${url}api/work-place/${workPlaceId}`, {
        headers: {
          Authorization: data.token || ""
        }
      })
      toast.success(res.data.message);
      fetchWorkPlaces();
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in delete workplace", error);
      toast.error(error?.response?.data?.error)
    } finally {
      setIsDeleting("")
    }
  }

  async function fetchWorkPlaces() {
    try {
      setIsLoading(true)
      const workPlaces = await fetchWorkplace();
      setWorkPlaces(workPlaces);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    fetchWorkPlaces();
    fetchCountries();
    if (workPlaceObj.Country) {
      fetchStateData();
    }
  }, []);

  useEffect(() => {
    if (workPlaceObj?.Country) {
      fetchStateData(workPlaceObj?.Country)
    }
  }, [changeWorkplace.isEdit])

  return (
    changeWorkplace.isAdd ? <CommonModel type={"WorkPlace"} isAddData={changeWorkplace.isAdd} isWorkingApi={isWorkingApi} employees={employees} dataObj={workPlaceObj} countries={countries} states={states} modifyData={handleChangeWorkPlace} addData={addWorkplace} changeData={fillworkplaceObj} /> :
      changeWorkplace.isEdit ? <CommonModel type={"WorkPlace"} isAddData={changeWorkplace.isEdit} employees={employees} isWorkingApi={isWorkingApi} dataObj={workPlaceObj} countries={countries} states={states} modifyData={handleChangeWorkPlace} editData={editWorkPlace} changeData={fillworkplaceObj} /> :
        changeWorkplace.isView ? <CommonModel type={"View WorkPlace"} employees={employees} isAddData={changeWorkplace.isView} dataObj={workPlaceObj} countries={countries} states={states} modifyData={handleChangeWorkPlace} /> :
          <div className="container">
            <div className="my-3 row">
              <div className="col-6 d-flex justify-content-start">
                <span>
                  <h5>PLACES OF WORK</h5>
                </span>
              </div>
              <div className="col-6 d-flex justify-content-end">
                <button type="button" onClick={() => handleChangeWorkPlace("Add")} className="button">
                  NEW PLACE TO WORK
                </button>
              </div>
            </div>
            <p className="mt-3">
              Places of work are where working activities are conducted. Only assign employees to their regular place of work.
            </p>
            <p className="text-warning my-2">
              <InfoIcon /> Note: Places of work cannot be fully edited once they have employees assigned.
            </p>

            {isLoading ? <Skeleton
              sx={{ bgcolor: 'grey.500' }}
              variant="rectangular"
              width={"100%"}
              height={"50vh"}
            /> :
              workPlaces.length > 0 ? (
                <LeaveTable data={workPlaces} isLoading={isDeleting} handleChangeData={handleChangeWorkPlace} deleteData={deleteWorkplace} />
              ) : (
                <h5 className="d-flex align-items-center justify-content-center" style={{ height: "60vh", color: "red" }} >Workplace data not found</h5>
              )
            }
          </div>
  );
};

export default WorkPlaceTab;
