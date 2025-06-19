import React, { useContext } from "react";
import { useState, useRef, useEffect } from "react";
import "./leaveForm.css";
import axios from "axios";
import { fetchAllEmployees, fetchEmployeeData, fetchRoles, getDepartments } from "./ReuseableAPI";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "./Loader";
import { EssentialValues } from "../App";
import EmployeeForm from "./EmployeeForm";

const AddEmployee = () => {
  const { id } = useParams();
  const { whoIs, data } = useContext(EssentialValues);
  const [details, setDetails] = useState("personal");
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [timePatterns, setTimePatterns] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employeeObj, setEmployeeObj] = useState({});
  const [scrolledHeight, setScrolledHeight] = useState(0);
  const personalRef = useRef(null);
  const contactRef = useRef(null);
  const employmentRef = useRef(null);
  const payslipRef = useRef(null);
  const jobRef = useRef(null);
  const financialRef = useRef(null);
  const url = process.env.REACT_APP_API_URL;
  const { token } = data;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLeaveTypes, setSelectedLeavetypes] = useState([]);
  const [preview, setPreview] = useState("");

  function handlePersonal() {
    if (personalRef.current) {
      const scrollDown = personalRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: scrollDown,
        behavior: "smooth"
      })
    }
  }
  const [stateData, setStateData] = useState([]);

  const fillEmpObj = (value, name) => {
    let countryFullData;

    if (name === "country") {
      countryFullData = countries.find(country =>
        Object.values(country).includes(value)
      );
      setStateData(countryFullData?.states || []);
      setEmployeeObj(pre => ({
        ...pre,
        countryCode: countryFullData?.code || ""
      }));
    }

    setEmployeeObj(prev => {
      if (["country", "state", "city", "zipCode"].includes(name)) {
        return {
          ...prev,
          address: {
            ...prev.address,
            [name]: name === "country" && countryFullData ? countryFullData.name : value
          }
        };
      }

      return {
        ...prev,
        [name]: typeof value === "string" ? value?.trimStart()?.replace(/\s+/g, ' ') : value
      };
    });
  };

  function changeImg(event) {
    const { name, files } = event.target;
    if (files && files[0]) {
      setPreview(URL.createObjectURL(files[0]));
      setEmployeeObj(pre => ({
        ...pre,
        [name]: files[0]
      }));
    }
  };

  function handlePayslip() {
    if (payslipRef.current) {
      const scrollDown = payslipRef.current.getBoundingClientRect().top + window.scrollY;
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
    } else if (value === "payslip") {
      return handlePayslip();
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
      console.log(err);
    }
  }

  const fetchTeamLead = async () => {
    try {
      const employees = await fetchAllEmployees()

      let filterTL = employees.filter(emp => emp?.position?.PositionName === "Team Lead").map(emp => emp);

      setLeads(filterTL);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchManagers = async () => {
    try {
      const employees = await fetchAllEmployees();

      let filterManager = employees.filter(emp => emp?.position?.PositionName === "Manager").map(emp => emp);
      setManagers(filterManager);
    } catch (err) {
      console.error(err);
    }
  };

  async function gettingRoleData() {
    try {
      const roleData = await fetchRoles();
      if (["emp", "hr", "manager"].includes(whoIs)) {
        setRoles(roleData.filter((role) => ["Assosiate", "HR", "Manager"].includes(role.RoleName)))
      } else {
        setRoles(roleData)
      }
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
      if (err.status === 401) {
        navigate(`/${whoIs}/unauthorize`)
      }
    }
  }

  async function fetchEmployee() {
    setIsLoading(true);
    try {
      const empData = await fetchEmployeeData(id);
      setPreview(empData.profile);

      setEmployeeObj({
        ...empData,
        company: Array.isArray(empData?.company) ? empData.company[0] : empData?.company || "",
        department: empData?.department?._id || "",
        workingTimePattern: empData?.workingTimePattern?._id || "",
        position: empData?.position?._id || "", // Safely access first element's _id or set to empty string
        role: empData?.role._id || "",
      });
      const countryFullData = countries.find((country) => Object.values(country).includes(empData?.countryCode));
      setStateData(countryFullData?.states);
      if (empData?.typesOfLeaveCount && Object.values(empData?.typesOfLeaveCount).length) {
        setSelectedLeavetypes(Object.entries(empData?.typesOfLeaveCount)?.map(([key, value]) => key + " " + value))
      }
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleTagSelector = value => {
    let leaveCount = 0;
    const leaveTypeCount = {};

    value.forEach(type => {
      const key = type.split(" ").slice(0, 2).join(" ");
      leaveTypeCount[key] = Number(type.split(" ").at(-1));
      leaveCount += Number(type.split(" ").at(-1));
    });

    setEmployeeObj(pre => ({
      ...pre,
      annualLeaveEntitlement: leaveCount,
      typesOfLeaveCount: leaveTypeCount
    }));
    setSelectedLeavetypes(value);
  }

  useEffect(() => {
    if (scrolledHeight > 3000) {
      setDetails("payslip")
    } else if (scrolledHeight > 2400) {
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
        const departments = await getDepartments()
        setDepartments(departments);

      } catch (err) {
        toast.error(err);
        console.log(err.data);
      }
    }
    fetchDepartments();
    fetchPositions();
    gettingRoleData();
    fetchCompanies();
    fetchCountries();
    fetchtimePatterns();
    fetchTeamLead();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [countries])
  return (
    <>
      {isLoading ? (
        <Loading height="80vh" />
      ) :
        <EmployeeForm
          details={details}
          selectedLeaveTypes={selectedLeaveTypes}
          handleTagSelector={handleTagSelector}
          employeeObj={employeeObj}
          setEmployeeObj={setEmployeeObj}
          changeImg={changeImg}
          fillEmpObj={fillEmpObj}
          stateData={stateData}
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
          payslipRef={payslipRef}
          contactRef={contactRef}
          employmentRef={employmentRef}
          jobRef={jobRef}
          financialRef={financialRef}
          leads={leads}
          departments={departments}
          positions={positions}
          managers={managers}
          timePatterns={timePatterns}
          preview={preview}
        />
      }
    </>
  )
};

export default AddEmployee;