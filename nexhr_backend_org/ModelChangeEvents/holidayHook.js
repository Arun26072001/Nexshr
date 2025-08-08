const schedule = require("node-schedule");
const { Employee } = require("../models/EmpModel");
const { pushNotification, sendMail } = require("../Reuseable_functions/notifyFunction");

module.exports = function attachHolidayHooks(schema) {
  // Maintain scheduled jobs per Holiday document to avoid duplicates on updates
  const jobsByDoc = new Map(); // key: docId, value: Array<schedule.Job>

  function parseHolidayDate(dateVal) {
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d;
    } catch (_) {}
    return null;
  }

  function scheduleUpcomingHolidayForDoc(doc) {
    if (!doc) return;
    const holidayDoc = typeof doc.toObject === "function" ? doc.toObject() : doc;
    const { _id: docId, holidays = [], company } = holidayDoc;

    // Cancel any existing jobs for this doc
    const existing = jobsByDoc.get(String(docId));
    if (Array.isArray(existing)) {
      existing.forEach((job) => {
        try { job.cancel(); } catch (_) {}
      });
      jobsByDoc.delete(String(docId));
    }

    const newJobs = [];

    // Schedule for each holiday: trigger one day before at 10:00 AM
    holidays.forEach((h) => {
      const holidayDate = parseHolidayDate(h?.date || h?.on || h?.day);
      if (!holidayDate) return;

      const trigger = new Date(holidayDate.getTime());
      trigger.setDate(trigger.getDate() - 1);
      trigger.setHours(10, 0, 0, 0); // 10:00 AM local time one day before

      // Skip past triggers
      if (trigger <= new Date()) return;

      const title = "Upcoming Holiday Tomorrow";
      const message = `Tomorrow is ${h?.title || "a company holiday"} (${holidayDate.toDateString()}). Enjoy your day off!`;

      const job = schedule.scheduleJob(trigger, async () => {
        try {
          // Notify all active employees of the company
          const emps = await Employee.find({ company, isDeleted: false }, "FirstName LastName Email fcmToken company").populate("company", "CompanyName");

          for (const emp of emps) {
            if (emp?.fcmToken) {
              await pushNotification(emp.company?._id || company, "holidayNotifications", "upcomingHoliday", {
                tokens: emp.fcmToken,
                title,
                body: message,
                path: "/holidays"
              });
            }

            if (emp?.Email) {
              await sendMail(emp.company?._id || company, "holidayNotifications", "upcomingHoliday", {
                to: emp.Email,
                subject: title,
                html: `<p>${message}</p>`,
                from: `\u003c${process.env.FROM_MAIL}\u003e (Nexshr)`
              });
            }
          }
        } catch (err) {
          // Do not crash the job
          console.error("upcomingHoliday scheduler error:", err?.message || err);
        }
      });

      newJobs.push(job);
    });

    if (newJobs.length > 0) {
      jobsByDoc.set(String(docId), newJobs);
    }
  }

  schema.post("save", function (doc) {
    scheduleUpcomingHolidayForDoc(doc);
  });

  schema.post("findOneAndUpdate", function (doc) {
    if (!doc) return;
    scheduleUpcomingHolidayForDoc(doc);
  });
};
