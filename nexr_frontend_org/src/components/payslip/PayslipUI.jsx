import React from 'react';
import "./payslipui.css";
import logo from "../../imgs/webnexs_logo.png";

export default function PayslipUI() {
    return (
        <div className="container">
            <div className='d-flex payslipHeader'>
                <div>
                    <h1>Bright</h1>
                    <p><b>Bright Livingstone Consultancy Private LTD</b></p>
                </div>
                <div>
                    <p>Bright Livingstone Consultancy Private LTD</p>
                    <p>SIDCO, TS-2, Thirumidivakkam, Chennai,</p>
                    <p>TamilNadu - 600044 India</p>
                </div>
                <div>
                    <img src={logo} alt="" />
                    <p>Payslip For This Month</p>
                    <p><b>September 2024</b></p>
                </div>
            </div>

            <div className='d-flex payslipHeader'>
                <div>
                    <p>Employee Summary</p>
                    <ul>
                        <li>Employee Name : Arun kumar</li>
                        <li>Employee ID : W03920</li>
                        <li>DOJ : 10/01/2024</li>
                        <li>DOB : 30/10/2001</li>
                    </ul>
                </div>
                <div>
                    <div className="boxBorder">
                        <div style={{ borderBottom: "2px double black" }}>
                            <p>10000</p>
                            <p>Employee Net Pay</p>
                        </div>
                        <div>
                            <p>Paid Days: 22.00</p>
                            <p>LOP Days: 0</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='d-flex payslipHeader'>
                <div>
                    <ul>
                        <li>Bank : Bank name</li>
                        <li>Account Number : 09243932432</li>
                        <li>Division : Software Development</li>
                    </ul>
                </div>
                <div>
                    <ul>
                        <li>Designation : Internship</li>
                        <li>Pan Number : AAAA</li>
                        <li>Location : Madurai</li>
                    </ul>
                </div>
            </div>

            <table class="table">
                <thead class="thead-light">
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">First</th>
                        <th scope="col">Last</th>
                        <th scope="col">Handle</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">1</th>
                        <td>Mark</td>
                        <td>Otto</td>
                        <td>@mdo</td>
                    </tr>
                    <tr>
                        <th scope="row">2</th>
                        <td>Jacob</td>
                        <td>Thornton</td>
                        <td>@fat</td>
                    </tr>
                    <tr>
                        <th scope="row">3</th>
                        <td>Larry</td>
                        <td>the Bird</td>
                        <td>@twitter</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
