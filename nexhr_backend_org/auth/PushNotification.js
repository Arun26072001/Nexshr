const admin = require("./firebase-admin");
const { Employee } = require("../models/EmpModel");
const axios = require("axios");
const { getCurrentTimeInMinutes, timeToMinutes } = require("../Reuseable_functions/reusableFunction");

exports.sendPushNotification = async (msgObj) => {
    const { token, title, body, company } = msgObj;
    try {
        // const user = await Employee.findById(userId, "fcmToken");
        if (!token) {
            // if (!user.fcmToken) {
            // return res.status(404).json({ error: "No FCM tokens found for this user" });
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

        // res.status(200).json({ message: "Notifications sent successfully", response });
    } catch (error) {
        console.error("Error sending notification:", error);
        return;
        // return res.status(500).json({ error: "Failed to send notification", details: error.message });
    }
};

exports.verifyWorkingTimeCompleted = async (data) => {
    const empData = await Employee.findById(data.employee, "workingTimePattern")
        .populate("workingTimePattern").exec();

    let startingTimes = data.login?.startingTime;
    let endingTimes = data.login?.endingTime;

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
    const scheduleWorkingHours = getTotalWorkingHourPerDay(
        empData.workingTimePattern.StartingTime,
        empData.workingTimePattern.FinishingTime
    )
    let isCompleteworkingHours = true;
    const Subject = "Why are you logout early?"
    const message = "If you have any personal work, please enter as reason."
    if (scheduleWorkingHours > totalValue && !data.login.reasonForEarlyLogout) {
        isCompleteworkingHours = false;
        await sendPushNotification({
            token: empData.fcmToken,
            company: empData.company,
            title: Subject,
            body: message
        });
    } else {
        await sendPushNotification({
            token: empData.fcmToken,
            company: empData.company,
            title: Subject,
            body: message
        });
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
        console.log(delay);

        setTimeout(async () => {
            console.log("call after the delay");

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

                const lastValue = values.at(-1) || 0;

                // Compare duration (in minutes) with the original delay time (converted to number)
                if (startingTimes.length !== endingTimes.length && lastValue > Number(time)) {
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
