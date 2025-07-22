import { Skeleton } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react'
import { DateRangePicker, Input } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from './NoDataFound';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';
import { checkEmpIsPermanentWFH } from '../ReuseableAPI';

export default function WorkFromHome() {
  const url = process.env.REACT_APP_API_URL;
  const { data, whoIs } = useContext(EssentialValues);
  const { token, _id } = data;
  const [isPermanentWFH, setIsPermanentWFH] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState({});
  const [dateRangeValue, setDaterangeValue] = useState([]);
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState("");

  async function fetchWfhReuests() {
    setIsLoading(true)
    try {
      const res = await axios.get(`${url}/api/wfh-application/employee/${data._id}`, {
        params: {
          dateRangeValue
        },
        headers: {
          Authorization: token || ""
        }
      })
      setRequests(res.data);
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in fetch wfhRequests", error);
    } finally {
      setIsLoading(false)
    }
  }

    async function checkPermanentWFH() {
      const isPermanent = await checkEmpIsPermanentWFH(_id);
      if(isPermanent){
        setIsPermanentWFH(isPermanent);
      }
    }
  
    useEffect(() => {
      checkPermanentWFH()
    }, [])

  useEffect(() => {
    fetchWfhReuests();
  }, [dateRangeValue])

  async function deleteRequest(id) {
    try {
      setIsDeleting(id)
      const res = await axios.delete(`${url}/api/wfh-application/${id}`, {
        headers: {
          Authorization: token || ""
        }
      })
      toast.success(res.data.message);
      fetchWfhReuests();
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in delete wfh request", error);
    } finally {
      setIsDeleting("")
    }
  }
  return (
    <div >
      {/* top date input and leave label */}
      <div className="leaveDateParent row px-2">
        <p className="payslipTitle col-6">
          WFH Requests
        </p>
        <div className="col-6 d-flex justify-content-end">
          <DateRangePicker size="lg" className="ml-1" showOneCalendar placement="bottomEnd" value={dateRangeValue} placeholder="Filter Range of Date" onChange={setDaterangeValue} />
          <button className="button mx-1" disabled={isPermanentWFH} title={isPermanentWFH ? "You have the permanent WFH option, so there's no need to apply for WFH." : "You can submit a WFH request."} onClick={() => navigate(`/${whoIs}/wfh-request`)}>
            Apply WFH
          </button>
        </div>
      </div>

      <div className="leaveContainer d-block">
        <div className="w-100 d-flex justify-content-center my-2">
          <div className="leaveBoard">
            <div className="leaveData col-12 col-lg-3">
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {requests?.approvedRequests || 0} Days
                </div>
                <div className="leaveDaysDesc">
                  Taken requests
                </div>
              </div>
            </div>
            <div className="leaveData col-12 col-lg-3">
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {requests?.upcommingRequests || 0} Days
                </div>
                <div className="leaveDaysDesc">
                  Upcoming requests
                </div>
              </div>
            </div>
            <div className="leaveData col-lg-3 col-12" style={{ borderRight: "none" }} >
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {requests?.pendingRequests || 0} Days
                </div>
                <div className="leaveDaysDesc">
                  Pending request
                </div>
              </div>
            </div>
          </div>
        </div>
        {
          isLoading ?
            <Skeleton
              sx={{ bgcolor: 'grey.500' }}
              variant="rounded"
              height={"50vh"}
            /> :
            requests?.correctRequests?.length > 0 ?
              <LeaveTable data={requests.correctRequests} isLoading={isDeleting} deleteData={deleteRequest} />
              : <NoDataFound message={"WFH Requests not for this month!"} />
        }
      </div>
    </div>
  )
}
