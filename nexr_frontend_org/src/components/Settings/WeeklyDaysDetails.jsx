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
                <ul key={index} className="list-unstyled">
                    <li><p className="lead"><b>{name}</b>{"  "+pattern.StartingTime} - {pattern.FinishingTime+"  "}{pattern.BreakTime} mins break</p></li>
                </ul>
            ))}
            <>
                <p><b>{pattern.WeeklyDays}</b> working days totaling <b>{calculateTotalHours(pattern.StartingTime, pattern.FinishingTime, pattern.BreakTime).toFixed(2)}</b> hrs excluding breaks.</p>
                <p>Public holidays are deducted from the annual leave entitlement.</p>
            </>
        </div>
    )
};

export default WeeklyDaysDetails;
