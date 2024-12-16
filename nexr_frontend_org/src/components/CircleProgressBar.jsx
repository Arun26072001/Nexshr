import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CircleBar from './CircleProcess';

const CircleProgressBar = ({ isTeamLead, token, account, id, isTeamHead }) => {
  const url = process.env.REACT_APP_API_URL;
  const [todayLeaveCount, setTodayLeaveCount] = useState(0);
  const [tomorrowLeaveCount, setTomorrowLeaveCount] = useState(0);
  const [yesterdayLeaveCount, setYesterdayLeaveCount] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [emps, setEmps] = useState([]);

  // Calculate dates for today, tomorrow, and yesterday, skipping weekends
  let today = new Date();

  let tomorrow = new Date(today);
  while (true) {
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() !== 6 && tomorrow.getDay() !== 0) {
      break;
    }
  }

  let yesterday = new Date(today);
  while (true) {
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.getDay() !== 6 && yesterday.getDay() !== 0) {
      break;
    }
  }

  const formatDate = (date) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  useEffect(() => {
    async function fetchData() {
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
    }

    async function fetchDataInTeam() {
      try {
        // Fetch leave requests
        const leaveRes = await axios.get(`${url}/api/leave-application/lead/${id}`, {
          headers: {
            authorization: token || "",
          },
        });
        setLeaveRequests(leaveRes.data.leaveData);

        // Fetch employees
        const empRes = await axios.get(`${url}/api/team/lead/${id}`, {
          headers: {
            authorization: token || "",
          },
        });
        setEmps(empRes.data.employees);

      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          toast.error(err.response.data.message);
        }
      }
    }

    if (account === "2") {
      fetchData();
    } else if (account === "3" && isTeamLead || account === "3" && isTeamHead) {
      fetchDataInTeam();
    }
  }, [url, token]);

  useEffect(() => {
    const getLeaveCounts = async () => {
      setTodayLeaveCount(0);
      setTomorrowLeaveCount(0);
      setYesterdayLeaveCount(0);

      const todayDate = today.toISOString().split("T")[0];
      const tomorrowDate = tomorrow.toISOString().split("T")[0];
      const yesterdayDate = yesterday.toISOString().split("T")[0];

      leaveRequests.forEach((request) => {
        const appliedDate = new Date(request.fromDate).toISOString().split("T")[0];

        if (appliedDate === todayDate) {
          setTodayLeaveCount((prev) => prev + 1);
        } else if (appliedDate === tomorrowDate) {
          setTomorrowLeaveCount((prev) => prev + 1);
        } else if (appliedDate === yesterdayDate) {
          setYesterdayLeaveCount((prev) => prev + 1);
        }
      });
    }

    getLeaveCounts();
  }, [leaveRequests]);

  return (
    <div className='row d-flex justify-content-center'>
      <div className='col-lg-4 col-md-4 col-12'>
        <p className='text-center'>{formatDate(yesterday).replace(",", "")}</p>
        <CircleBar empLength={emps.length} leaveCount={yesterdayLeaveCount} />
      </div>
      <div className='col-lg-4 col-md-4 col-12'>
        <p className='text-center text-primary'>{formatDate(today).replace(",", "")}</p>
        <CircleBar empLength={emps.length} leaveCount={todayLeaveCount} />
      </div>
      <div className='col-lg-4 col-md-4 col-12'>
        <p className='text-center'>{formatDate(tomorrow).replace(",", "")}</p>
        <CircleBar empLength={emps.length} leaveCount={tomorrowLeaveCount} />
      </div>
    </div>
  );
};

export default CircleProgressBar;
