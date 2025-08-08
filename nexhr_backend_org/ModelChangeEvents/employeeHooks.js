// hooks/employeeHooks.js

const { sendMail, pushNotification } = require("../Reuseable_functions/notifyFunction");
const { getNotificationSettings } = require("../services/NotificationService");

module.exports = function attachEmployeeHooks(Employee, schema) {
    const schedule = require("node-schedule");

    function isValidDate(value) {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.getHours() !== 0;
    }

    function scheduleAnnualLeaveRenewal(emp) {
        const { annualLeaveYearStart, company } = emp;
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

            await Promise.all([
                emp?.fcmToken &&
                pushNotification(company, "employee", "annualLeaveRenewed", {
                    tokens: emp.fcmToken,
                    title,
                    body: message,
                    path: "/leave/balance",
                    data: { employeeId: emp._id }
                }),

                emp?.Email &&
                sendMail(company, "employee", "annualLeaveRenewed", {
                    to: emp.Email,
                    subject: title,
                    html: `<p>${message}</p>`
                })
            ]);
        });
    }

    function scheduleBirthdayGreeting(emp) {
        const { DOB, company } = emp;
        if (!DOB || !isValidDate(DOB)) return;

        const dob = new Date(DOB);
        const date = dob.getDate();
        const month = dob.getMonth() + 1;

        schedule.scheduleJob(`0 0 8 ${date} ${month} *`, async () => {
            const title = "🎉 Happy Birthday!";
            const message = `Wishing you a fantastic birthday filled with joy and success. Have a great year ahead!`;

            await Promise.all([
                emp?.fcmToken &&
                pushNotification(company, "employee", "birthday", {
                    tokens: emp.fcmToken,
                    title,
                    body: message,
                    path: "/profile",
                    data: { employeeId: emp._id }
                }),

                emp?.Email &&
                sendMail(company, "employee", "birthday", {
                    to: emp.Email,
                    subject: title,
                    html: `<p>${message}</p>`
                })
            ]);
        });
    }

    function scheduleWorkAnniversaryGreeting(emp) {
        const { DOJ, company } = emp;
        if (!DOJ || !isValidDate(DOJ)) return;

        const doj = new Date(DOJ);
        const date = doj.getDate();
        const month = doj.getMonth() + 1;

        schedule.scheduleJob(`0 0 8 ${date} ${month} *`, async () => {
            const title = "🎉 Happy Work Anniversary!";
            const message = `Congratulations on your work anniversary! Thank you for being an integral part of the team.`;

            await Promise.all([
                emp?.fcmToken &&
                pushNotification(company, "employee", "workAnniversary", {
                    tokens: emp.fcmToken,
                    title,
                    body: message,
                    path: "/profile",
                    data: { employeeId: emp._id }
                }),

                emp?.Email &&
                sendMail(company, "employee", "workAnniversary", {
                    to: emp.Email,
                    subject: title,
                    html: `<p>${message}</p>`
                })
            ]);
        });
    }

    schema.post("save", async function (doc) {
        const emp = doc.toObject();
        const { employeeManagement } = await getNotificationSettings(emp.company);
        scheduleAnnualLeaveRenewal(emp);
        if (employeeManagement["birthday"]) {
            scheduleBirthdayGreeting(emp);
        }
        if (employeeManagement["workAnniversary"]) {
            scheduleWorkAnniversaryGreeting(emp);
        }
    });

    schema.post("findOneAndUpdate", async function (doc) {
        if (!doc) return;
        const emp = doc.toObject();
        const { employeeManagement } = await getNotificationSettings(emp.company);
        scheduleAnnualLeaveRenewal(emp);
        if (employeeManagement["birthday"]) {
            scheduleBirthdayGreeting(emp);
        }
        if (employeeManagement["workAnniversary"]) {
            scheduleWorkAnniversaryGreeting(emp);
        }
    });
};
