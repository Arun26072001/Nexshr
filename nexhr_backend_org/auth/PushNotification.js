const admin = require("./firebase-admin");
const axios = require("axios");
const schedule = require("node-schedule");
const { getCurrentTimeInMinutes, getTimeFromDateOrTimeData } = require("../Reuseable_functions/reusableFunction");

exports.sendPushNotification = async (msgObj) => {
    const { token, title, body } = msgObj;

    try {
        if (!token) {
            console.log("No FCM tokens found for this user");
            return;
        }
        const message = {
            token,
            data: {
                title,
                body,
                type: msgObj.type || "",
                url: msgObj.path || ""
            }
        };

        await admin.messaging().send(message).then((res) => {
            console.log("successfully notification triggered", res);
        }).catch((err) => {
            console.log(`error in pushnotification for: ${msgObj?.name}`, err);
        })
    } catch (error) {
        // await errorCollector({ url: "push-notifcation", name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error("Error sending notification:", error);
        return;
    }
};

exports.askReasonForDelay = (req, res) => {
    try {
        const { time, timerId, timeOption, token } = req.body;
        const delay = Number(time) * 60000;

        if (isNaN(delay) || delay <= 0) {
            console.error("Invalid delay time:", time);
            return res.status(400).send({ error: "Invalid delay time" });
        }

        const runAt = new Date(Date.now() + delay);

        const job = schedule.scheduleJob(runAt, async () => {
            try {
                const timerRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/clock-ins/item/${timerId}`, {
                    headers: { Authorization: token },
                });

                const timeData = timerRes.data.timeData[timeOption];
                const employeeId = timerRes.data.timeData.employee._id;
                const startingTimes = timeData?.startingTime || [];
                const endingTimes = timeData?.endingTime || [];

                const values = startingTimes.map((startTime, index) => {
                    if (!startTime) return 0;

                    const endTimeInMin = endingTimes[index]
                        ? getTimeFromDateOrTimeData(endingTimes[index])
                        : getCurrentTimeInMinutes().getTime();

                    const startTimeInMin = getTimeFromDateOrTimeData(startTime);
                    return Math.abs((endTimeInMin - startTimeInMin) / (1000 * 60));
                });
                const lastValue = values.at(-1) || 0;

                if (startingTimes.length !== endingTimes.length && lastValue > Number(time)) {
                    await axios.post(
                        `${process.env.REACT_APP_API_URL}/api/clock-ins/remainder/${employeeId}/${timeOption}`,
                        {},
                        { headers: { Authorization: token } }
                    );
                    if (!timeData.reasonForLate) {
                        return res.send({ message: `Your ${timeOption} time limit reached`, isAddreasonForDelay: false, scheduledTime: runAt });
                    } else {
                        return res.send({ message: `Your ${timeOption} time limit reached`, isAddreasonForDelay: true, scheduledTime: runAt });
                    }
                } else {
                    return res.send({ message: `Your ${timeOption} time limit reached` })
                }
            } catch (error) {
                console.error("Error during reminder logic:", error);
            }
        });


    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};


// exports.askReasonForDelay = (req, res) => {
//     try {
//         const { time, timerId, timeOption, token } = req.body;
//         const delay = Number(time) * 60000;
//         if (isNaN(delay) || delay <= 0) {
//             console.error("Invalid delay time:", time);
//             return res.status(400).send({ error: "Invalid delay time" });
//         }

//         setTimeout(async () => {
//             try {
//                 const timerRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/clock-ins/item/${timerId}`, {
//                     headers: { Authorization: token }
//                 });

//                 const timeData = timerRes.data.timeData[timeOption];
//                 const employeeId = timerRes.data.timeData.employee._id;
//                 const startingTimes = timeData?.startingTime || [];
//                 const endingTimes = timeData?.endingTime || [];

//                 const values = startingTimes.map((startTime, index) => {
//                     if (!startTime) return 0;

//                     const endTimeInMin = endingTimes[index]
//                         ? getTimeFromDateOrTimeData(endingTimes[index])
//                         : getCurrentTimeInMinutes().getTime();

//                     const startTimeInMin = getTimeFromDateOrTimeData(startTime);
//                     return Math.abs((endTimeInMin - startTimeInMin) / (1000 * 60));
//                 });

//                 const lastValue = values.at(-1) || 0;

//                 // Compare duration (in minutes) with the original delay time (converted to number)
//                 if (startingTimes.length !== endingTimes.length && lastValue > Number(time)) {
//                     await axios.post(
//                         `${process.env.REACT_APP_API_URL}/api/clock-ins/remainder/${employeeId}/${timeOption}`,
//                         {},
//                         { headers: { Authorization: token } }
//                     );
//                     console.log("Reminder sent successfully.");
//                 }
//             } catch (error) {
//                 console.error("Error during reminder logic:", error);
//             }
//         }, delay);

//         return res.send({ message: "Enabled ask reason for late" });
//     } catch (error) {
//         // await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
//         return res.status(500).send({ error: error.message });
//     }
// };
