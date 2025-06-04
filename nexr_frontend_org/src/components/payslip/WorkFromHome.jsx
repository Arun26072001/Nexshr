import { Skeleton } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react'
import { DateRangePicker, Input } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from './NoDataFound';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';

export default function WorkFromHome() {
  const url = process.env.REACT_APP_API_URL;
  const { data, whoIs } = useContext(EssentialValues);
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState({});
  const [dateRangeValue, setDaterangeValue] = useState([]);
  const navigate = useNavigate();

  async function fetchWfhReuests() {
    setIsLoading(true)
    try {
      const res = await axios.get(`${url}/api/wfh-application/employee/${data._id}`, {
        params: {
          dateRangeValue
        },
        headers: {
          Authorization: data.token || ""
        }
      })
      setRequests(res.data);
    } catch (error) {
      console.log("error in fetch wfhRequests", error);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWfhReuests();
  }, [dateRangeValue])

  async function deleteRequest(id) {
    try {
      const res = await axios.delete(`${url}/api/wfh-application/${id}`, {
        headers: {
          Authorization: data.token || ""
        }
      })
      toast.success(res.data.message);
      fetchWfhReuests();
    } catch (error) {
      console.log("error in delete wfh request", error);
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
          <button className="button mx-1" onClick={() => navigate(`/${whoIs}/wfh-request`)}>
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
                  {requests?.approvedRequests?.length || 0} Days
                </div>
                <div className="leaveDaysDesc">
                  Taken requests
                </div>
              </div>
            </div>
            <div className="leaveData col-12 col-lg-3">
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {requests?.upcommingRequests?.length || 0} Days
                </div>
                <div className="leaveDaysDesc">
                  Upcoming requests
                </div>
              </div>
            </div>
            <div className="leaveData col-lg-3 col-12" style={{ borderRight: "none" }} >
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {requests?.pendingRequests?.length || 0} Days
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
              <LeaveTable data={requests.correctRequests} deleteData={deleteRequest} />
              : <NoDataFound message={"WFH Requests not for this month!"} />
        }
      </div>
    </div>
  )
}
