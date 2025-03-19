import React, { useContext } from "react";
import { useState, useRef, useEffect } from "react";
import "./leaveForm.css";
import axios from "axios";
import AddEmployeeForm from "./AddEmployeeform";
import { fetchAllEmployees, fetchEmployeeData, fetchRoles, getDepartments } from "./ReuseableAPI";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EditEmployeeform from "./EditEmployeeform";
import { TimerStates } from "./payslip/HRMDashboard";
import Loading from "./Loader";
import { EssentialValues } from "../App";

const AddEmployee = () => {
  const { id } = useParams();
  const { isEditEmp } = useContext(TimerStates);
  const { whoIs } = useContext(EssentialValues);
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
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  function handlePersonal() {
    if (personalRef.current) {
      const scrollDown = personalRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: scrollDown,
        behavior: "smooth"
      })
    }
  }

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
        setRoles(roleData.filter((role) => ["Assosiate", "Human Resource", "Manager"].includes(role.RoleName)))
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

      setEmployeeObj({
        FirstName: empData?.FirstName || "",
        LastName: empData?.LastName || "",
        Email: empData?.Email || "",
        Password: empData?.Password || "",
        teamLead: empData?.teamLead || "", // Safely access first element or set to empty string
        managerId: empData?.managerId || "", // Safely access first element or set to empty string
        countryCode: empData.countryCode || "",
        phone: empData?.phone || "",
        company: Array.isArray(empData?.company) ? empData.company[0] : empData?.company || "",
        dateOfBirth: empData?.dateOfBirth || "",
        gender: empData?.gender || "",
        address: {
          city: empData?.address?.city || "",
          state: empData?.address?.state || "",
          country: empData?.address?.country || "",
          zipCode: empData?.address?.zipCode || ""
        },
        position: empData?.position?._id || "", // Safely access first element's _id or set to empty string
        department: empData?.department?._id || "",
        role: empData?.role._id || "",
        description: empData?.description || "",
        dateOfJoining: empData?.dateOfJoining || "",
        employmentType: empData?.employmentType || "",
        workingTimePattern: empData?.workingTimePattern?._id || "",
        annualLeaveYearStart: empData?.annualLeaveYearStart || "",
        companyWorkingHourPerWeek: empData?.companyWorkingHourPerWeek || "",
        publicHoliday: empData?.publicHoliday || "",
        monthlyPermissions: empData?.monthlyPermissions || 2,
        typesOfLeaveCount: empData?.typesOfLeaveCount || {},
        annualLeaveEntitlement: empData?.annualLeaveEntitlement || "",
        basicSalary: empData?.basicSalary || "",
        bankName: empData?.bankName || "",
        accountNo: empData?.accountNo || "",
        accountHolderName: empData?.accountHolderName || "",
        IFSCcode: empData?.IFSCcode || "",
        taxDeduction: empData?.taxDeduction || ""
      });

    } catch (error) {
      console.log(error);

      toast.error(error.message);
    }
    setIsLoading(false);
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

    if (id) {
      fetchEmployee();
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


  return (
    <>
      {isLoading ? (
        <Loading height="80vh" />
      ) : isEditEmp && employeeObj?.FirstName ? (
        <EditEmployeeform
          details={details}
          empData={employeeObj}
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
        />
      ) : (
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
        />
      )}
    </>
  )
};

export default AddEmployee;
