import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CircleBar from './CircleProcess';
import { Skeleton } from '@mui/material';
import { EssentialValues } from '../App';
import { formatDate } from './ReuseableAPI';
import { useNavigate } from 'react-router-dom';

const CircleProgressBar = ({ isTeamLead, isTeamHead, isTeamManager }) => {
  const navigate = useNavigate();
  const url = process.env.REACT_APP_API_URL;
  const [todayLeaveCount, setTodayLeaveCount] = useState(0);
  const [tomorrowLeaveCount, setTomorrowLeaveCount] = useState(0);
  const [yesterdayLeaveCount, setYesterdayLeaveCount] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [emps, setEmps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data, whoIs } = useContext(EssentialValues);
  const { token, Account, _id } = data;
  const [today, setToday] = useState(null);
  const [tomorrow, setTomorrow] = useState(null);
  const [yesterday, setYesterday] = useState(null);

  useEffect(() => {
    async function initDates() {
      const referenceDate = new Date(); // today's date as a base

      // 1. Get valid **yesterday**
      const yesterdayDate = new Date(referenceDate);
      while (true) {
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yCheck = new Date(yesterdayDate);
        const yValid = await checkIsLeaveDate(yCheck);

        if (!yValid) {
          setYesterday(yCheck);
          break;
        }
      }


      // 2. Get valid **today**
      const todayDate = new Date(referenceDate);
      while (true) {
        todayDate.setDate(todayDate.getDate() + 1);
        const tCheck = new Date(todayDate);
        const tValid = await checkIsLeaveDate(tCheck);
        if (!tValid) {
          setToday(tCheck);
          break;
        }
      }

      // 3. Get valid **tomorrow**
      const tomorrowDate = new Date(todayDate); // start from "today"
      while (true) {
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tmCheck = new Date(tomorrowDate);
        const tmValid = await checkIsLeaveDate(tmCheck);
        console.log("tmValid", tmValid)
        if (!tmValid) {
          setTomorrow(tmCheck);
          break;
        }
      }
    }

    initDates();
  }, []);


  async function checkIsLeaveDate(date) {
    try {
      const checkIsValidLeave = await axios.get(`${url}/api/leave-application/check-is-valid-leave/${_id}`, {
        params: {
          date
        },
        headers: {
          Authorization: token || ""
        }
      })
      console.log("date", date, "checkIsValidLeave", checkIsValidLeave.data)
      return checkIsValidLeave.data;
    } catch (error) {
      if (error.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in check LeaveDate", error.message)
    }
  }

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch leave requests
        const leaveRes = await axios.get(`${url}/api/leave-application/hr`, {
          headers: {
            authorization: token || "",
          },
        });
        setLeaveRequests(leaveRes.data);

        // Fetch employees
        const empRes = await axios.get(`${url}/api/employee`, {
          headers: {
            authorization: token || "",
          },
        });
        setEmps(empRes.data);

      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          toast.error(err.response.data.message);
        }
      }
      setIsLoading(false);
    }

    async function fetchDataInTeam() {
      setIsLoading(true)
      try {
        // Fetch leave requests
        const leaveRes = await axios.get(`${url}/api/leave-application/team/${_id}`, {
          params: {
            who: isTeamHead ? "head" : isTeamLead ? "lead" : "manager"
          },
          headers: {
            authorization: token || "",
          },
        });

        setLeaveRequests(leaveRes.data.leaveData);

        // Fetch employees
        const empRes = await axios.get(`${url}/api/team/members/${_id}`, {
          params: {
            who: isTeamLead ? "lead" : isTeamHead ? "head" : isTeamManager ? "manager" : "employees",
          },
          headers: {
            authorization: token || "",
          },
        });
        setEmps(empRes.data.employees);

      } catch (err) {
        console.log("error in fetch team members", err);
        if (err.message === "Network Error") {
          navigate("/network-issue")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (Account === "2") {
      fetchData();
    } else if ([isTeamLead, isTeamHead, isTeamManager].includes(true)) {
      fetchDataInTeam();
    }
  }, [url, token]);

  useEffect(() => {
    const getLeaveCounts = async () => {
      setTodayLeaveCount(0);
      setTomorrowLeaveCount(0);
      setYesterdayLeaveCount(0);

      const todayDate = today.toISOString().split("T")[0];
      const tomorrowDate = tomorrow ? tomorrow.toISOString().split("T")[0] : "";
      const yesterdayDate = yesterday ? yesterday.toISOString().split("T")[0] : "";
      if (leaveRequests?.length) {
        leaveRequests.forEach((request) => {
          const appliedDate = new Date(request?.fromDate).toISOString().split("T")[0];
          if (appliedDate === todayDate) {
            setTodayLeaveCount((prev) => prev + 1);
          } else if (appliedDate === tomorrowDate) {
            setTomorrowLeaveCount((prev) => prev + 1);
          } else if (appliedDate === yesterdayDate) {
            setYesterdayLeaveCount((prev) => prev + 1);
          }
        });
      }
    }
    if (today && tomorrow && yesterday) {
      getLeaveCounts();
    }
  }, [leaveRequests, today, tomorrow, yesterday]);

  return (
    <div className='row d-flex justify-content-center'>
      <div className='col-lg-4 col-md-4 col-12' style={{ cursor: "pointer" }} title={`${yesterdayLeaveCount} Employees were on leave yesterday.`} onClick={() => navigate(`/${whoIs}/leave/leave-request`, { state: { date: yesterday, type: "yesterday" } })}>
        <p className='text-center'>{formatDate(yesterday).replace(",", "")}</p>
        {
          // yesterday
          isLoading ? <Skeleton variant="circular" width={120} height={120} style={{ margin: "20px auto" }} /> :
            <CircleBar empLength={emps?.length} leaveCount={yesterdayLeaveCount} />
        }
      </div>
      <div className='col-lg-4 col-md-4 col-12' style={{ cursor: "pointer" }} title={`${todayLeaveCount} Employees are on leave today.`} onClick={() => navigate(`/${whoIs}/leave/leave-request`, { state: { date: today, type: "today" } })}>
        <p className='text-center text-primary'>{formatDate(today).replace(",", "")}</p>
        {
          // today
          isLoading ? <Skeleton variant="circular" width={120} height={120} style={{ margin: "20px auto" }} /> :
            <CircleBar empLength={emps?.length} leaveCount={todayLeaveCount} />
        }
      </div>
      <div className='col-lg-4 col-md-4 col-12' style={{ cursor: "pointer" }} title={`${tomorrowLeaveCount} Employees will be on leave tomorrow.`} onClick={() => navigate(`/${whoIs}/leave/leave-request`, { state: { date: tomorrow, type: "tomorrow" } })}>
        <p className='text-center'>{formatDate(tomorrow).replace(",", "")}</p>
        {
          // tomarrow
          isLoading ? <Skeleton variant="circular" width={120} height={120} style={{ margin: "20px auto" }} /> :
            <CircleBar empLength={emps?.length} leaveCount={tomorrowLeaveCount} />
        }
      </div>
    </div>
  );
};

export default CircleProgressBar;
