// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import "./payslip.css";

// export default function PayslipParent() {
//     const [payslip, setPayslip] = useState("");
//     return (
//         <div className="payslipParent">
//             <Link to="/attendence">
//                 <div>Attendence</div>
//             </Link>
//             <Link to="/leave">
//                 <div className={`${payslip === "leave" && "selected"}`} onClick={() => setPayslip("leave")}>Leave</div>
//             </Link>
//             <Link to="/folder">
//                 <div className={`${payslip === "folder" && "selected"}`} onClick={() => setPayslip("folder")}>Folder</div>
//             </Link>
//             <Link to="/assets">
//                 <div className={`${payslip === "assets" && "selected"}`} onClick={() => setPayslip("assets")}>Assets</div>
//             </Link>
//             <Link to="/history">
//                 <div className={`${payslip === "history" && "selected"}`} onClick={() => setPayslip("history")}>History</div>
//             </Link>
//             <Link to="/salary">
//                 <div className={`${payslip === "salary" && "selected"}`} onClick={() => setPayslip("salary")}>Salary</div>
//             </Link>
//             <Link to="/payrun">
//                 <div className={`${payslip === "payrun" && "selected"}`} onClick={() => setPayslip("payrun")}>Payrun</div>
//             </Link>
//             <Link to="/slip">
//                 <div className={`${payslip === "slip" && "selected"}`} onClick={() => setPayslip("slip")}>Slip</div>
//             </Link>
//             <Link to="/address">
//                 <div className={`${payslip === "address" && "selected"}`} onClick={() => setPayslip("address")}>Address</div>
//             </Link>
//             <Link to="/contact">
//                 <div className={`${payslip === "contact" && "selected"}`} onClick={() => setPayslip("contact")}>Contact</div>
//             </Link>
//             <Link to="/social">
//                 <div className={`${payslip === "social" && "selected"}`} onClick={() => setPayslip("social")}>Social</div>
//             </Link>
//         </div>
//     )
// }
