const admin = require("./firebase-admin");
const { Employee } = require("../models/EmpModel");
const axios = require("axios");
const { getCurrentTimeInMinutes, timeToMinutes, getTotalWorkingHourPerDay } = require("../Reuseable_functions/reusableFunction");
const { Task } = require("../models/TaskModel");

exports.sendPushNotification = async (msgObj) => {
    const { token, title, body, company } = msgObj;
    try {
        if (!token) {
            console.log("No FCM tokens found for this user");
            return;
        }
        const message = {
            token,
            notification: { title, body },
            data: {
                companyData: JSON.stringify(company),
                type: msgObj.type ? msgObj.type : ""
            }
        };

        const response = await admin.messaging().send(message)
        console.log("Notifications sent successfully:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
        return;
    }
};

exports.verifyWorkingTimeCompleted = async (req, res) => {
    try {
        const { employee, login } = req.body;
        const empData = await Employee.findById(employee, "FirstName LastName workingTimePattern")
            .populate("workingTimePattern").exec();

        let startingTimes = login?.startingTime;
        let endingTimes = login?.endingTime;

        const values = startingTimes?.map((startTime, index) => {
            if (!startTime) return 0; // No start time means no value

            let endTimeInMin = 0;
            if (endingTimes[index]) {
                // Calculate time difference with an ending time
                endTimeInMin = timeToMinutes(endingTimes[index]);
            } else {
                // Calculate time difference with the current time
                endTimeInMin = getCurrentTimeInMinutes();
            }
            const startTimeInMin = timeToMinutes(startTime);
            return Math.abs(endTimeInMin - startTimeInMin);
        });

        const totalValue = values?.reduce((acc, value) => acc + value, 0) / 60;
        const officeStartingTime = `${new Date(empData.workingTimePattern.StartingTime).getHours()}:${new Date(empData.workingTimePattern.StartingTime).getMinutes()}`;
        const officeFinishingTime = `${new Date(empData.workingTimePattern.FinishingTime).getHours()}:${new Date(empData.workingTimePattern.FinishingTime).getMinutes()}`;
        const scheduleWorkingHours = getTotalWorkingHourPerDay(
            officeStartingTime,
            officeFinishingTime
        )
        let isCompleteworkingHours = true;
        if (scheduleWorkingHours > totalValue && !login.reasonForEarlyLogout) {
            isCompleteworkingHours = false;
        }
        return res.send({ isCompleteworkingHours })
    } catch (error) {
        console.log("error in check working hour is complated", error);
        return res.status(500).send({ error: error.message })
    }
}

exports.askReasonForDelay = (req, res) => {
    try {
        const { time, timerId, timeOption, token } = req.body;
        const delay = Number(time) * 60000;
        if (isNaN(delay) || delay <= 0) {
            console.error("Invalid delay time:", time);
            return res.status(400).send({ error: "Invalid delay time" });
        }

        setTimeout(async () => {

            try {
                const timerRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/clock-ins/item/${timerId}`, {
                    headers: { Authorization: token }
                });

                const timeData = timerRes.data.timeData[timeOption];
                const employeeId = timerRes.data.timeData.employee._id;
                const startingTimes = timeData?.startingTime || [];
                const endingTimes = timeData?.endingTime || [];

                const values = startingTimes.map((startTime, index) => {
                    if (!startTime) return 0;

                    const endTimeInMin = endingTimes[index]
                        ? timeToMinutes(endingTimes[index])
                        : getCurrentTimeInMinutes();

                    const startTimeInMin = timeToMinutes(startTime);
                    return Math.abs(endTimeInMin - startTimeInMin);
                });
                console.log(values);

                const lastValue = values.at(-1) || 0;

                console.log(startingTimes.length, endingTimes.length, lastValue, time);

                // Compare duration (in minutes) with the original delay time (converted to number)
                if (startingTimes.length !== endingTimes.length && lastValue >= Number(time)) {
                    await axios.post(
                        `${process.env.REACT_APP_API_URL}/api/clock-ins/remainder/${employeeId}/${timeOption}`,
                        {},
                        { headers: { Authorization: token } }
                    );
                    console.log("Reminder sent successfully.");
                }
            } catch (error) {
                console.error("Error during reminder logic:", error);
            }
        }, delay);

        return res.send({ message: "Enabled ask reason for late" });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};
