// hooks/employeeHooks.js

module.exports = function attachEmployeeHooks(Employee, schema) {
    const schedule = require("node-schedule");
    const sendMail = require("../routes/mailSender");
    const { sendPushNotification } = require("../auth/PushNotification"); // Make sure this exists

    function isValidDate(value) {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.getHours() !== 0;
    }

    function scheduleAnnualLeaveRenewal(emp) {
        const { annualLeaveYearStart } = emp;
        if (!annualLeaveYearStart || !isValidDate(annualLeaveYearStart)) return;

        const dateObj = new Date(annualLeaveYearStart);
        const date = dateObj.getDate();
        const month = dateObj.getMonth() + 1;

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
                await sendPushNotification({ token: emp.fcmToken, title, body: message });
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
    }

    function scheduleBirthdayGreeting(emp) {
        const { DOB } = emp;
        if (!DOB || !isValidDate(DOB)) return;

        const dob = new Date(DOB);
        const date = dob.getDate();
        const month = dob.getMonth() + 1;

        schedule.scheduleJob(`0 0 8 ${date} ${month} *`, async () => {
            const title = "🎉 Happy Birthday!";
            const message = `Wishing you a fantastic birthday filled with joy and success. Have a great year ahead!`;

            if (emp?.fcmToken) {
                await sendPushNotification({ token: emp.fcmToken, title, body: message });
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
    }

    function scheduleWorkAnniversaryGreeting(emp) {
        const { DOJ } = emp;
        if (!DOJ || !isValidDate(DOJ)) return;

        const doj = new Date(DOJ);
        const date = doj.getDate();
        const month = doj.getMonth() + 1;

        schedule.scheduleJob(`0 0 8 ${date} ${month} *`, async () => {
            const title = "🎉 Happy Work Anniversary!";
            const message = `Congratulations on your work anniversary! Thank you for being an integral part of the team.`;

            if (emp?.fcmToken) {
                await sendPushNotification({ token: emp.fcmToken, title, body: message });
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
    }

    schema.post("save", async function (doc) {
        const emp = doc.toObject();
        scheduleAnnualLeaveRenewal(emp);
        scheduleBirthdayGreeting(emp);
        scheduleWorkAnniversaryGreeting(emp);
    });

    schema.post("findOneAndUpdate", async function (doc) {
        if (!doc) return;
        const emp = doc.toObject();
        scheduleAnnualLeaveRenewal(emp);
        scheduleBirthdayGreeting(emp);
        scheduleWorkAnniversaryGreeting(emp);
    });
};
