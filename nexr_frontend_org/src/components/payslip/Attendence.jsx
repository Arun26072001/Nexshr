import React, { useEffect, useState } from "react";
import "./payslip.css";
import axios from "axios";
import LeaveTable from "../LeaveTable";
import { DateRangePicker } from "rsuite";
import Loading from "../Loader";
import { formatTime } from "../ReuseableAPI";
import NoDataFound from "./NoDataFound";
import { toast } from "react-toastify";
import Cookies from "universal-cookie";
import { jwtDecode } from "jwt-decode";

const Attendence = (props) => {
  const cookies = new Cookies();
  const token = cookies.get("token");
  const { _id } = jwtDecode(token);
  const url = process.env.REACT_APP_API_URL;
  const [clockInsData, setclockInsData] = useState({});
  const [regularHeight, setRegularHeight] = useState(0);
  const [lateHeight, setLateHeight] = useState(0);
  const [earlyHeight, setEarlyHeight] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [daterangeValue, setDaterangeValue] = useState("");


  function calculateOverallBehavior(regularCount, lateCount, earlyCount) {
    const totalCount = regularCount + lateCount + earlyCount;

    if (totalCount === 0) {
      return "No data"; // Handle case with no logins
    }

    const regularAvg = (regularCount / totalCount) * 100;
    const lateAvg = (lateCount / totalCount) * 100;
    const earlyAvg = (earlyCount / totalCount) * 100;

    // Determine the dominant behavior based on the highest percentage
    if (regularAvg >= lateAvg && regularAvg >= earlyAvg) {
      return "Regular";
    } else if (lateAvg >= regularAvg && lateAvg >= earlyAvg) {
      return "Late";
    } else {
      return "Early";
    }
  }

  function calculateWorkAvailablity(empWorkHour, companyWorkHour) {
    if (empWorkHour !== 0) {
      return ((empWorkHour / companyWorkHour) * 100).toFixed(2)
    } else {
      return 0;
    }
  }

  useEffect(() => {
    const getClockins = async () => {
      setIsLoading(true);
      if (_id) {
        const dashboard = await axios.get(`${url}/api/clock-ins/employee/${_id}`, {
          params: {
            daterangeValue
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setclockInsData(dashboard.data);
        setTableData(dashboard.data.clockIns);
        const { totalEarlyLogins, totalLateLogins, totalRegularLogins } = dashboard.data;
        const totalLogins = totalEarlyLogins + totalLateLogins + totalRegularLogins

        // Calculate height percentages
        if (totalLogins > 0) {
          setRegularHeight((totalRegularLogins / totalLogins) * 100);
          setLateHeight((totalLateLogins / totalLogins) * 100);
          setEarlyHeight((totalEarlyLogins / totalLogins) * 100);
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error("Employee Id not found!")
      }
    }
    getClockins()
  }, [_id, daterangeValue])

  //   useEffect(() => {
  //     const getLeaveData = async () => {
  //         try {
  //             const leaveData = await axios.get(`${url}/api/leave-application/date-range/${_id}`, {
  //                 params: {
  //                     daterangeValue
  //                 },
  //                 headers: {
  //                     authorization: token || ""
  //                 }
  //             })
  //             console.log(leaveData.data);

  //             setLeaveRequests(leaveData.data);
  //             setFullLeaveRequests(leaveData.data);
  //         } catch (err) {
  //             toast.error(err?.response?.data?.message)
  //         }
  //     }

  //     getLeaveData();
  // }, [daterangeValue, _id])

  return (
    <div>
      {/* <PayslipRouter /> */}

      <div className="leaveDateParent">
        <div className="payslipTitle">
          Attendance
        </div>
        <div>
          <DateRangePicker value={daterangeValue} placeholder="Select Date" onChange={setDaterangeValue} />
        </div>
      </div>

      {/* <div className="container"> */}
      {isLoading ? <Loading />
        : Object.keys(clockInsData).length > 0 ? <>
          <div className="row w-100 mx-auto">
            <div className="chartParent">
              <div className="col-lg-3 regular" style={{ height: `${regularHeight}%` }}>
                {
                  clockInsData.totalRegularLogins == 0 ?
                    <div className="d-flex justify-content-center emtChart">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalRegularLogins} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Regular)</p>
                    </div>
                    : <div className="d-flex justify-content-center">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalRegularLogins} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Regular)</p>
                    </div>
                }
              </div>
              <div className="col-lg-3 early" style={{ height: `${earlyHeight}%` }}>
                {
                  clockInsData.totalEarlyLogins == 0 ?
                    <div className="d-flex justify-content-center emtChart">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalEarlyLogins} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Early)</p>
                    </div> : <div className="d-flex justify-content-center">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalEarlyLogins} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Early)</p>
                    </div>
                }
              </div>
              <div className="col-lg-3 late" style={{ height: `${lateHeight}%` }}>
                {
                  clockInsData.totalLateLogins == 0 ?
                    <div className="d-flex justify-content-center emtChart">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalLateLogins} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Late)</p>
                    </div> : <div className="d-flex justify-content-center">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalLateLogins} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Late)</p>
                    </div>
                }
              </div>
              <div className="col-lg-3 leave" style={{ height: `${clockInsData.totalLeaveDays * 10}%` }}>
                {
                  clockInsData.totalLeaveDays == 0 ?
                    <div className="d-flex justify-content-center emtChart">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalLeaveDays} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Leave)</p>
                    </div> : <div className="d-flex justify-content-center">
                      <p className="payslipTitle" style={{ color: "#146ADC" }}>{clockInsData.totalLeaveDays} Days</p>
                      <p className="leaveDays text-center" style={{ color: "#146ADC" }}>(Leave)</p>
                    </div>
                }
              </div>
            </div>
          </div>

          <div className="leaveBoard">
            <div className="leaveData">
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {formatTime(clockInsData.companyTotalWorkingHour)}
                </div>
                <div className="leaveDaysDesc">
                  Total schedule hour
                </div>
              </div>
            </div>
            <div className="leaveData">
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {formatTime(clockInsData.totalLeaveDays * 9)}
                </div>
                <div className="leaveDaysDesc">
                  Leave hour
                </div>
              </div>
            </div>
            <div className="leaveData">
              <div className="d-flex flex-column">
                <div className="leaveDays" style={{ color: "#146ADC" }}>
                  %{calculateWorkAvailablity(Number(clockInsData.totalEmpWorkingHours), clockInsData.companyTotalWorkingHour)}
                </div>
                <div className="leaveDaysDesc" >
                  Total work availability
                </div>
              </div>
            </div>
            <div className="leaveData">
              <div className="d-flex flex-column">
                <div className="leaveDays text-success">
                  {formatTime(clockInsData.totalEmpWorkingHours)}
                </div>
                <div className="leaveDaysDesc">
                  Total active hour
                </div>
              </div>
            </div>
            <div className="leaveData">
              <div className="d-flex flex-column">
                <div className="leaveDays text-danger">
                  {(clockInsData.companyTotalWorkingHour - Number(clockInsData.totalEmpWorkingHours)).toFixed(0)} hour
                </div>
                <div className="leaveDaysDesc">
                  Balance
                </div>
              </div>
            </div>
            <div style={{ width: "30%", margin: "10px" }} >
              <div className="d-flex flex-column">
                <div className="leaveDays">
                  {calculateOverallBehavior(clockInsData.totalRegularLogins, clockInsData.totalLateLogins, clockInsData.totalEarlyLogins)}
                </div>
                <div className="leaveDaysDesc">
                  Average Behaviour
                </div>
              </div>
            </div>
          </div>

          <LeaveTable data={tableData} />
        </> : <NoDataFound message={"Attendance data not found!"} />
      }

    </div>
  )
};

export default Attendence;
