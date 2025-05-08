const admin = require("./firebase-admin");
const { Employee } = require("../models/EmpModel");

exports.sendPushNotification = async (msgObj) => {
    const { token, title, body } = msgObj;
    // console.log(token, title, body);
    // console.log("Received Employee ID:", userId);
    // if (!userId) {
    //     return res.status(400).json({ error: "Employee ID is required" });
    // }
    try {
        // const user = await Employee.findById(userId);
        if (!token) {
            // return res.status(404).json({ error: "No FCM tokens found for this user" });
            console.log("No FCM tokens found for this user");
            return;
        }
        const message = {
            token,
            notification: { title, body },
        }

        const response = await admin.messaging().send(message)

        console.log("Notifications sent successfully:", response);

        // res.status(200).json({ message: "Notifications sent successfully", response });
    } catch (error) {
        console.error("Error sending notification:", error);
        return;
        // return res.status(500).json({ error: "Failed to send notification", details: error.message });
    }
};
