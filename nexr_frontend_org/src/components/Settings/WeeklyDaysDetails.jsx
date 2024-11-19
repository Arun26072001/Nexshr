import React from "react";

const WeeklyDaysDetails = ({ pattern }) => {
    const days = ["Mon", "Tues", "Wednes", "Thus", "Fri", "Sat", "Sun"];
    console.log(pattern);

    const calculateTotalHours = (startTime, endTime, breakTime) => {
        if (!startTime || !endTime || breakTime === undefined) {
            return 0;
        }

        // Parse the start time
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);
    
        // Parse the end time
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(endHour, endMinute, 0, 0);
    
        // Calculate the difference in milliseconds
        let diffMs = endDate - startDate;

        // If the end time is earlier than the start time, assume it crosses midnight
        if (diffMs < 0) {
            diffMs += 24 * 60 * 60 * 1000;
        }
    
        // Convert milliseconds to hours
        const diffHours = diffMs / (1000 * 60 * 60);
    
        // Subtract break time in hours
        const breakHours = breakTime / 60;
    
        // Calculate total working hours excluding breaks
        const totalWorkingHours = diffHours - breakHours;
        return totalWorkingHours;
    };
  
    return (
        <div className="content">
            {days.slice(0, pattern.WeeklyDays).map((name, index) => (
                <ul key={index} className="d-flex list-unstyled mb-2">
                <div style={{ width: "20%" }} className="text-muted">
                     <li>
                     <p className="text-muted mb-0" style={{ fontSize: "13px", fontWeight: "bold" }}>{name}</p>
                    </li>
                    </div>
                    <div style={{ width: "20%" }} className="text-muted"><p className="mb-0">{`${pattern.StartingTime} - ${pattern.FinishingTime} `}</p>
                    </div>
                    <div style={{ width: "20%" }} className="text-secondary">
                   <p className="mb-0">{pattern.BreakTime} mins break</p></div>
                 
                  
                  
                </ul>
            ))}
            <div className="mt-3">
                <p className="text-muted mb-1"><b>{pattern.WeeklyDays}</b> working days totaling <b>{calculateTotalHours(pattern.StartingTime, pattern.FinishingTime, pattern.BreakTime).toFixed(2)}</b> hrs excluding breaks.</p>
                <p  className="text-muted">Public holidays are deducted from the annual leave entitlement.</p>
            </div>
        </div>
    )
};

export default WeeklyDaysDetails;
