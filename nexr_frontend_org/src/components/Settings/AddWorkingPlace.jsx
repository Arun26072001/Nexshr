import * as React from 'react';
import "./SettingsStyle.css";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import InputComponent from './InputComponent';
import axios from 'axios';
import { useState, useEffect } from 'react';
import SelectEmp from './SelectEmp';
import { toast } from 'react-toastify';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function AddWorkingPlace({ changeModel, updateWorkPlaces }) {
  const url = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const [empName, setEmpName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [filteredEmps, setFilteredEmps] = useState([]);

  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([])
  const [workPlace, setWorkPlace] = useState({
    CompanyName: "",
    Address_1: "",
    Address_2: "",
    Country: [],
    State: [],
    Town: "",
    PostCode: "",
    EmpID: []
  });
  // Check required fields for enable next btn
  const isButtonEnabled = workPlace.CompanyName
    && workPlace.Address_1
    && workPlace.Country
    && workPlace.State
    && workPlace.Town;

  function ChangeAssignEmp(emp) {
    setWorkPlace({
      ...workPlace,
      ['EmpID']: [...workPlace.EmpID, emp._id]
    })
  }

  function removeEmp(emp) {
    console.log(emp._id);
    setWorkPlace(prevState => ({
      ...prevState,
      ['EmpID']: prevState.EmpID.filter(empId => empId !== emp._id)
    }));
  }

  function onChangeWorkPlace(e) {
    const { name, value } = e.target;
    console.log(name, value);
    if (name === "Country" || name === "State") {
      let values = value.split(",");
      setWorkPlace(prevWorkPlace => ({
        ...prevWorkPlace,
        [name]: values
      }));
      if (name == "Country") {
        axios.get(`${url}/api/country/${values[0]}`, {
          headers: {
            authorization: token || ""
          }
        })
          .then((res) => {
            console.log(res.data.states);
            setStateData(res.data.states);
          })
          .catch((err) => {
            console.log(err);
          });

        setWorkPlace(preValue => ({
          ...preValue,
          [name]: values
        }));
      }

    } else {
      setWorkPlace({
        ...workPlace,
        [name]: value
      })
    }
  }

  const [value, setValue] = useState(0);

  function handleNext(e) {
    e.preventDefault()
    if (value == 0 || value < 2) {
      setValue(value + 1)
    }
  }

  function handleBack() {
    if (value !== 0) {
      setValue(value - 1)
    }
  }

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const body = workPlace;
    await axios.post(url + "/api/work-place", body, {
      headers: {
        authorization: token || ""
      }
    }).then(res => {
      toast.success(res.data.message);
      changeModel();
      updateWorkPlaces();
    }).catch((err) => {
      if (err.response) {
        // Client received an error response (5xx, 4xx)
        switch (err.response.status) {
          case 400:
            toast.error(`Validation error: ${err.response.data.details.map(detail => detail.message).join(', ')}`);
            break;
          case 500:
            toast.error(err.response.data.message);
            break;
          default:
            toast.error("An unexpected error occurred");
        }
      } else if (err.request) {
        // Client never received a response, or request never left
        toast.error("Network error, please try again later");
      } else {
        // Anything else
        toast.error("An unexpected error occurred");
      }
    });
  };

  const filterEmps = (e) => {
    setEmpName(e);
    if (empName === "") {
      setFilteredEmps(employees)
    } else {
      setFilteredEmps(
        employees.filter((emp) =>
          emp.FirstName.toLowerCase().includes(e.toLowerCase())
        )
      );
    }
  };

  useEffect(() => {
    axios.get(url + "/api/country", {
      headers: {
        authorization: token || ""
      }
    })
      .then(res => {
        setCountryData(res.data);
      })
      .catch(err => {
        console.log(err);
      })
  }, [])

  useEffect(() => {
    async function fetchEmps() {
      await axios.get(url + `/api/employee`, {
        headers: {
          authorization: token || ""
        }
      }).then((res) => {
        setEmployees(res.data)
        setFilteredEmps(res.data)
      }).catch((err) => {
        console.log(err);
        setEmployees([]);
      })
    }
    fetchEmps()
  }, [])

  console.log(employees);
  return (
    <Box sx={{ width: '100%', backgroundColor: 'white', padding: "10px" }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} aria-label="basic tabs example">
          <Tab label="Details" {...a11yProps(0)} className='ccc' />
          <Tab label="Assign Employees" {...a11yProps(1)} className='ccc' />
        </Tabs>
      </Box>
      <form >
        <CustomTabPanel value={value} index={0}>
          <InputComponent inputName={"CompanyName"} inputValue={workPlace.CompanyName} name={"Name"} onChange={onChangeWorkPlace} additional={"You can use this name  to fillter addresses"} />
          <InputComponent inputName={"Address_1"} inputValue={workPlace.Address_1} name={"Address line 1"} onChange={onChangeWorkPlace} />
          <InputComponent inputName={"Address_2"} inputValue={workPlace.Address_2} name={"Address line 2"} onChange={onChangeWorkPlace} />
          {/* Country */}
          <div className="row mb-3">
            <div className="col-lg-4 d-flex align-items-center">
              <label htmlFor="" className="form-label inputFont">
                Country
              </label>
            </div>
            <div className="col-lg-8">
              <select onChange={onChangeWorkPlace} name="Country" value={workPlace.Country} className='form-control'>
                <option selected>Select country</option>
                {countryData.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.CountryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* State */}
          <div className="row mb-3">
            <div className="col-lg-4 d-flex align-items-center">
              <label htmlFor="" className="form-label inputFont">
                State
              </label>
            </div>
            <div className="col-lg-8">
              <select onChange={onChangeWorkPlace} className='form-control' value={workPlace.State} name="State">
                <option selected>Select State</option>
                {stateData && stateData.map((item) => {
                  return <option value={item._id}>{item.StateName}</option>
                })}
              </select>
            </div>
          </div>
          <InputComponent inputName={"Town"} inputValue={workPlace.Town} name={"Town/City"} onChange={onChangeWorkPlace} />

          <div className="row mb-3">
            <div className="col-lg-4 d-flex align-items-center">
              <label htmlFor="" className="form-label inputFont">
                Postcode
              </label>
            </div>
            <div className="col-lg-8">
              <input type="number" name="PostCode" value={workPlace.PostCode} className='form-control' placeholder={"Post code"} onChange={(e) => onChangeWorkPlace(e)} />
            </div>
          </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <div className="row mb-3">
            <div className="col-lg-4 d-flex align-items-center">
              <label htmlFor="" className="form-label inputFont">
                Name
              </label>
            </div>
            <div className="col-lg-8">
              <input type="text" name="EmpName" value={empName} className='form-control' onChange={(e) => filterEmps(e.target.value)} placeholder="Enter name" />
            </div>
          </div>
          {filteredEmps.length < 1 ? (<div className="dayBox text-center">
            <p className="text-danger lead">Employee data not found</p>
          </div>) : (filteredEmps.map((emp, index) => {
            const active = workPlace.EmpID.includes(emp._id)
            return <SelectEmp emp={emp} EmpID={workPlace.EmpID} key={index} removeEmp={removeEmp} active={active} action={ChangeAssignEmp} />
          }
          ))}
        </CustomTabPanel>
        <div className="d-flex justify-content-between">
          {/* <div> */}
            {value > 0 && <button className="button m-0" onClick={handleBack}>Back</button>}
            <button className="btn btn-secondary" onClick={changeModel}>Cancel</button>
          {/* </div> */}
          {value !== 1 ?
            <button className="button m-0" disabled={!isButtonEnabled} onClick={(e) => handleNext(e)}>
              Next
            </button> :
            <button type="submit" className="button m-0" onClick={handleOnSubmit} >
              Create
            </button>}
        </div>
      </form>

    </Box>
  );
}
