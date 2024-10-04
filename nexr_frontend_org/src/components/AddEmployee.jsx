import React from "react";
import { useState, useRef, useEffect } from "react";
import "./leaveForm.css";
import axios from "axios";
import AddEmployeeForm from "./AddEmployeeform";
import { fetchEmployees } from "./ReuseableAPI";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddEmployee = () => {
  const [details, setDetails] = useState("personal");
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [timePatterns, setTimePatterns] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [scrolledHeight, setScrolledHeight] = useState(0);
  const personalRef = useRef(null);
  const contactRef = useRef(null);
  const employmentRef = useRef(null);
  const jobRef = useRef(null);
  const financialRef = useRef(null);
  const url = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // function onChangeEmp(e) {
  //   console.log(e.target);

  //   const { name, value } = e.target;
  //   setEmployeeObj((prev) => ({
  //     ...prev,
  //     [name]: value
  //   }))
  // }

  // if(employeeObj.dateOfJoining !== ""){
  //   const dojGetTime = new Date(employeeObj.dateOfJoining).getTime();
  //   setEmployeeObj((prev)=>({
  //     ...prev,
  //     annualLeaveEntitlement: Math.ceil(new Date().getTime - dojGetTime/(1000*60*60*60*24*365))
  //   }))
  // }

  function handlePersonal() {
    if (personalRef.current) {
      const scrollDown = personalRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: scrollDown,
        behavior: "smooth"
      })
    }
  }

  function handleContact() {
    if (contactRef.current) {
      const scrollDown = contactRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: scrollDown,
        behavior: "smooth"
      })
    }
  }

  function handleEmployment() {
    if (employmentRef.current) {
      const scrollDown = employmentRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: scrollDown,
        behavior: "smooth"
      })
    }
  }

  function handleJob() {
    if (jobRef.current) {
      const scrollDown = jobRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: scrollDown,
        behavior: "smooth"
      })
    }
  }

  function handleFinancial() {
    if (financialRef.current) {
      const scrollDown = financialRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: scrollDown,
        behavior: "smooth"
      })
    }
  }

  function getScrollPx() {
    setScrolledHeight(window.scrollY || window.pageYOffset);
  }
  window.addEventListener("scroll", getScrollPx);

  function handleScroll(value) {
    setDetails(value);
    if (value === "personal") {
      return handlePersonal();
    } else if (value === "contact") {
      return handleContact();
    } else if (value === "employment") {
      return handleEmployment();
    } else if (value === "job") {
      return handleJob();
    } else {
      return handleFinancial();
    }
  }

  async function fetchPositions() {
    try {
      const positions = await axios.get(url + "/api/position", {
        headers: {
          authorization: token || ""
        }
      });
      setPositions(positions.data);

    } catch (err) {
      console.log(err.data);
    }
  }

  async function fetchtimePatterns() {
    try {
      const patterns = await axios.get(url + "/api/time-pattern", {
        headers: {
          authorization: token || ""
        }
      });
      setTimePatterns(patterns.data);

    } catch (err) {
      console.log(err.data);
    }
  }

  const fetchCompanies = async () => {
    try {
      const company = await axios.get(url + "/api/company", {
        headers: {
          authorization: token || ""
        }
      });
      setCompanies(company.data);

    } catch (err) {
      console.log(err.data);
    }
  }

  const fetchTeamLead = async () => {
    try {
      const employees = await fetchEmployees()

      let filterTL = employees.filter(emp => emp.position.some((pos) => pos.PositionName === "TL")).map(emp => emp);

      setLeads(filterTL);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchManagers = async () => {
    try {
      const employees = await fetchEmployees();

      let filterManager = employees.filter(emp => emp.position.some((pos) => pos.PositionName === "Manager")).map(emp => emp);

      setManagers(filterManager);

    } catch (err) {
      console.error(err);
    }
  };

  async function fetchRoles() {
    try {
      const res = await axios.get(`${url}/api/role`, {
        headers: {
          authorization: token || ""
        }
      })
      setRoles(res.data)
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchCountries() {
    try {
      const res = await axios.get(`${url}/api/country`, {
        headers: {
          authorization: token || ""
        }
      })
      setCountries(res.data)
    } catch (err) {
      toast.error(err.message)
      if(err.status == 401){
        navigate("/admin/unauthorize")
      }
    }
  }


  // useEffect(() => {
  //   const calculateTimeDifference = () => {
  //     if (timePatterns.length > 0) {
  //       const selectedPattern = timePatterns.find(pattern => pattern._id === employeeObj.workingTimePattern);
  //       if (selectedPattern && selectedPattern.StartingTime && selectedPattern.FinishingTime) {
  //         const [startHour, startMinute] = selectedPattern.StartingTime.split(":").map(num => parseInt(num, 10));
  //         const [endHour, endMinute] = selectedPattern.FinishingTime.split(":").map(num => parseInt(num, 10));

  //         const startDate = new Date();
  //         startDate.setHours(startHour);
  //         startDate.setMinutes(startMinute);

  //         const endDate = new Date();
  //         endDate.setHours(endHour);
  //         endDate.setMinutes(endMinute);

  //         const timeDiff = endDate.getTime() - startDate.getTime();
  //         const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  //         const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  //         setTimeDifference((hoursDiff * 60) + minutesDiff);
  //       }
  //     }
  //   };

  //   calculateTimeDifference();
  // }, [timePatterns, employeeObj.workingTimePattern]);

  useEffect(() => {
    if (scrolledHeight > 2400) {
      setDetails("financial")
    } else if (scrolledHeight > 1850) {
      setDetails("job");
    } else if (scrolledHeight > 1100) {
      setDetails("employment")
    } else if (scrolledHeight > 550) {
      setDetails("contact")
    } else if (scrolledHeight < 60) {
      setDetails("personal")
    }
  }, [scrolledHeight])

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const departments = await axios.get(url + "/api/department", {
          headers: {
            authorization: token || ""
          }
        });
        setDepartments(departments.data);

      } catch (err) {
        console.log(err.data);
      }
    }

    fetchDepartments();
    fetchPositions();
    fetchRoles();
    fetchCompanies();
    fetchCountries();
    fetchtimePatterns();
    fetchTeamLead();
    fetchManagers();
  }, [])

  return (
    <AddEmployeeForm
      details={details}
      companies={companies}
      handleScroll={handleScroll}
      countries={countries}
      handlePersonal={handlePersonal}
      handleContact={handleContact}
      handleEmployment={handleEmployment}
      handleJob={handleJob}
      handleFinancial={handleFinancial}
      roles={roles}
      personalRef={personalRef}
      contactRef={contactRef}
      employmentRef={employmentRef}
      jobRef={jobRef}
      financialRef={financialRef}
      leads={leads}
      departments={departments}
      positions={positions}
      managers={managers}
      timePatterns={timePatterns}
    />
  )
};

export default AddEmployee;
