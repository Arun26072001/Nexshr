import * as React from 'react';
import "./SettingsStyle.css";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import InputComponent from './InputComponent';
import SelectEmp from './SelectEmp';
import { fetchEmployees } from '../ReuseableAPI';


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

export default function EditWorkingPlace({ editWorkPlace, removeEmp, modifyWorkPlace, onChangeEdit, ChangeAssignEmp, changeEditModel }) {
  const url = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const [empName, setEmpName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [filteredEmps, setFilteredEmps] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);

  // Check if the required fields have values
  const selectedCountry = editWorkPlace.Country.CountryName;
  const selectedState = editWorkPlace.State.StateName;

  const [value, setValue] = useState(0);

  // const handleChange = (event, newValue) => {

  //   if(isButtonEnabled){
  //     setValue(value + 1)
  //   }
  //   else{
  //     setValue(0)
  //   }
  // };

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

  function handleOnSubmit(e) {
    e.preventDefault();
    const body = {
      ...editWorkPlace,
      ["EmpID"]: editWorkPlace.EmpID.map(id => (
        id
      ))
    };
    // console.log(body);
    axios.put(url + "/api/work-place/" + editWorkPlace._id, body, {
      headers: {
        authorization: token || ""
      }
    }).then(res => {
      modifyWorkPlace()
      changeEditModel()
      toast.success(res.data)
    }).catch((err) => {
      console.log(err);
    })
  }

  useEffect(() => {
    // setFilteredEmps(editWorkPlace)
    const fetchData = async () => {
      try {
        const countryResponse = await axios.get(`${url}/api/country`, {
          headers: {
            authorization: token || ""
          }
        });
        setCountryData(countryResponse.data);

        const stateResponse = await axios.get(`${url}/api/country/${editWorkPlace.Country._id}`, {
          headers: {
            authorization: token || ""
          }
        });
        setStateData(stateResponse.data.states);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [editWorkPlace]);

  useEffect(() => {
    const getEmps = async () => {
      try {
        const emps = await fetchEmployees();
        setEmployees(emps);
        setFilteredEmps(emps)
      } catch (err) {
        console.error(err);
        toast.error(err)
      }
    }
    getEmps();
  }, [])


  console.log(editWorkPlace);


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
          <InputComponent inputName={"CompanyName"} inputValue={editWorkPlace.CompanyName} name={"Name"} onChange={onChangeEdit} additional={"You can use this name  to fillter addresses"} />
          <InputComponent inputName={"Address_1"} inputValue={editWorkPlace.Address_1} name={"Address line 1"} onChange={onChangeEdit} />
          <InputComponent inputName={"Address_2"} inputValue={editWorkPlace.Address_2} name={"Address line 2"} onChange={onChangeEdit} />
          {/* Country */}
          <div className="row mb-3">
            <div className="col-lg-4 d-flex align-items-center">
              <label htmlFor="" className="form-label inputFont">
                Country
              </label>
            </div>
            <div className="col-lg-8">
              <select onChange={onChangeEdit} name="Country" className='form-control'>
                {countryData.map((item) => (
                  <option key={item._id} value={item._id} selected={selectedCountry === item.CountryName}>
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
              <select onChange={onChangeEdit} className='form-control' name="State">
                {stateData.length > 0 && stateData.map((item) => {
                  return <option key={item._id} value={item._id} selected={selectedState === item.StateName}>{item.StateName}</option>
                })}
              </select>
            </div>
          </div>
          <InputComponent inputName={"Town"} inputValue={editWorkPlace.Town} name={"Town/City"} onChange={onChangeEdit} />

          <InputComponent inputName={"PostCode"} name={"Postcode"} inputValue={editWorkPlace.PostCode} onChange={onChangeEdit} />
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
          {filteredEmps.length < 1 ? (
            <div className="dayBox text-center">
              <p className="text-danger lead">Employee data not found</p>
            </div>
          ) : (
            filteredEmps.map((emp, index) => {
              let active;
              editWorkPlace.EmpID.map((item, index) => {
                if (item == emp._id) {
                  active = true;
                }
              })
              return (
                <SelectEmp
                  emp={emp}
                  EmpID={editWorkPlace.EmpID}
                  key={index}
                  removeEmp={removeEmp}
                  active={active}
                  action={ChangeAssignEmp}
                />
              );
            })
          )}
        </CustomTabPanel>
        <div className="d-flex justify-content-between">
          {value > 0 && <button type="button" className="button m-0" onClick={handleBack}>Back</button>}
          <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={changeEditModel}>Cancel</button>
          {value !== 1 ?
            <button type="button" className="button m-0" onClick={handleNext}>
              Next
            </button> :
            <button type="submit" onClick={handleOnSubmit} className="button m-0" >
              Update
            </button>}
        </div>
      </form>

    </Box>
  );
}
