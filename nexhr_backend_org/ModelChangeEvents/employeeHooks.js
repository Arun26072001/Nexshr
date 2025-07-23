// hooks/employeeHooks.js

module.exports = function attachEmployeeHooks(Employee, schema) {
    const schedule = require("node-schedule");
    const sendMail = require("../routes/mailSender");

    function isValidDate(value) {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.getHours() !== 0;
    }

    schema.post("save", async function (doc) {
        const emp = doc.toObject();
        const { annualLeaveYearStart } = emp;

        if (!annualLeaveYearStart) return;
        const annualLeaveYearStartDate = new Date(annualLeaveYearStart);
        const [date, month] = [annualLeaveYearStartDate.getDate(), annualLeaveYearStartDate.getMonth()]

        schedule.scheduleJob(`0 0 8 ${date} ${month} *`, async () => {
            const renewedRemainingLeaveDays = {};
            const typesOfLeaveCount = emp?.typesOfLeaveCount;
            if (typesOfLeaveCount && Object.values(typesOfLeaveCount).length > 0) {
                const renewableFields = Object.entries(typesOfLeaveCount).filter(([key, value]) => key !== "Permission");
                renewableFields.map(([name, value]) => renewedRemainingLeaveDays[name] = value)
            }
            const updatedEmpObj = {
                ...emp,
                annualLeaveYearStart: `${new Date().getFullYear()}-${month}-${date}`,
                typesOfLeaveRemainingDays: renewedRemainingLeaveDays
            }
            await Employee.findByIdAndUpdate(emp._id, updatedEmpObj);
            if (emp.Email && emp.fcmToken) {
                const title = "Your annual leave entitlement has been renewed.";
                const message = `Your annual leave days have been successfully renewed as part of the yearly leave cycle.
       You can now view and utilize your updated leave balance for the current period.
        Please contact HR if you have any questions or need further assistance.`;
                if (creator?.fcmToken) {
                    await sendPushNotification({
                        token: creator.fcmToken,
                        title,
                        body: message,
                    });
                }

                await sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: creator.Email,
                    Subject: title,
                    TextBody: message
                });
            }
        });
    });

    schema.post("findOneAndUpdate", async function (doc) {
        if (!doc) return;

        const emp = doc.toObject();
        const { annualLeaveYearStart } = emp;

        if (!annualLeaveYearStart || !isValidDate(annualLeaveYearStart)) return;

        const dateObj = new Date(annualLeaveYearStart);
        const date = dateObj.getDate();
        const month = dateObj.getMonth() + 1; // JS months are 0-based


        schedule.scheduleJob(`0 0 8 ${date} ${month} *`, async () => {

            const renewedRemainingLeaveDays = {};
            const typesOfLeaveCount = emp?.typesOfLeaveCount;

            if (typesOfLeaveCount && typeof typesOfLeaveCount === "object") {
                for (const [key, value] of Object.entries(typesOfLeaveCount)) {
                    if (key !== "Permission") {
                        renewedRemainingLeaveDays[key] = value;
                    }
                }
            }

            const updatedEmpObj = {
                typesOfLeaveRemainingDays: renewedRemainingLeaveDays,
                annualLeaveYearStart: `${String(date).padStart(2, "0")}-${String(month).padStart(2, "0")}-${new Date().getFullYear()}`
            };

            await Employee.findByIdAndUpdate(emp._id, updatedEmpObj);

            const title = "Your annual leave entitlement has been renewed.";
            const message = `Your annual leave days have been successfully renewed as part of the yearly leave cycle. You can now view and utilize your updated leave balance. Please contact HR if you have any questions.`;

            if (emp?.fcmToken) {
                await sendPushNotification({
                    token: emp.fcmToken,
                    title,
                    body: message,
                });
            }

            if (emp?.Email) {
                await sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: emp.Email,
                    Subject: title,
                    TextBody: message,
                });
            }
        });
    });
};
