import React from "react"

const History = (props) => {
    const historyData = [
        { salary: "$8800", name: "Arun Kumar", date: "6/10/2024", code: "B-10D21" },
        { salary: "$9000", name: "John Doe", date: "7/10/2024", code: "B-10D22" },
        { salary: "$8500", name: "Jane Smith", date: "8/10/2024", code: "B-10D23" },
        { salary: "$8700", name: "Alice Brown", date: "9/10/2024", code: "B-10D24" }
    ];
    return (
        <div className="container-fluid">
            <div className="payslipTitle">
                History
            </div>
            {historyData.map((item, index) => (
                <div className="historyCard" key={index}>
                    <div className="salaryFont">{item.salary}</div>
                    <div className="d-flex">
                        <div className="historyCardText" style={{borderRight: "2px solid gray" }}>{item.name}</div>
                        <div className="historyCardText" style={{borderRight: "2px solid gray" }}>{item.date}</div>
                        <div className="historyCardText">{item.code}</div>
                    </div>
                </div>
            ))}
        </div>
    )
};

export default History;
