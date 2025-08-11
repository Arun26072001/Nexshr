const schedule = require("node-schedule");
const axios = require("axios");
const TimePattern = require("../models/TimePatternModel");

module.exports = function attachSettingsHooks(schema) {
  // Keep single-instance jobs here and per-company jobs in a map
  const scheduledJobs = {
    notifyKnow: null, // deprecated for global; kept to allow cancel
    rejectPending: null,
    payslipByCompany: new Map(), // key: companyId, value: job
    notifyKnowByCompany: new Map(), // key: companyId, value: job
  };

  // Define job logic separately so we can re-use them
  async function makeKnowLeave() {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/leave-application/make-know`);
      console.log(response.data);
    } catch (error) {
      console.log("error in makeKnowLeave", error?.response?.data?.error || error.message);
    }
  }

  async function makeKnowWFH() {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/wfh-application/make-know`);
      console.log(response.data);
    } catch (error) {
      console.log("error in makeKnowWFH", error?.response?.data?.error || error.message);
    }
  }

  async function finalResponseLeave() {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/leave-application/final-response-leave`);
      console.log(res.data);
    } catch (error) {
      console.log("error in finalResponseLeave", error?.response?.data?.error || error.message);
    }
  }

  async function finalResponseWFH() {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/wfh-application/final-reponse-wfh`);
      console.log(res.data);
    } catch (error) {
      console.log("error in finalResponseWFH", error?.response?.data?.error || error.message);
    }
  }

  // Helper to (re)schedule monthly payslip generation for a company
  function schedulePayslipJobForCompany(companyId, generationDate) {
    // Cancel existing if present
    const existing = scheduledJobs.payslipByCompany.get(String(companyId));
    if (existing) {
      existing.cancel();
      scheduledJobs.payslipByCompany.delete(String(companyId));
    }

    // Determine day-of-month
    let dayOfMonth = 4; // default fallback
    let dayOfHour;
    try {
      if (generationDate) {
        const d = new Date(generationDate);
        if (!isNaN(d.getTime())) {
          dayOfMonth = d.getDate();
          dayOfHour = d.getHours();
        }
      }
    } catch (_) {
      // keep default
    }

    // node-schedule cron format: second minute hour dayOfMonth month dayOfWeek
    // Run at 10:00:00 on the specified day of every month
    const cronExpr = `0 0 ${dayOfHour} ${dayOfMonth} * *`;

    const job = schedule.scheduleJob(cronExpr, async function () {
      try {
        // Current implementation generates payslips for all employees
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payslip/`, {});
        console.log(`Payslip generation (${companyId}) response:`, response.data);
      } catch (err) {
        console.error(`Error while generating payslips for company ${companyId}:`, err?.response?.data?.error || err.message);
      }
    });

    scheduledJobs.payslipByCompany.set(String(companyId), job);
  }

  // Map WeeklyDays strings to dayOfWeek numbers (0=Sun..6=Sat)
  function mapWeeklyDaysToNumbers(weeklyDays = []) {
    const map = {
      Sunday: 0,
      sun: 0,
      Monday: 1,
      mon: 1,
      Tuesday: 2,
      tue: 2,
      Wednesday: 3,
      wed: 3,
      Thursday: 4,
      thu: 4,
      Friday: 5,
      fri: 5,
      Saturday: 6,
      sat: 6,
      'sun-day': 0,
      'mon-day': 1,
      'tues-day': 2,
      'wed-nes-day': 3,
      'thur-day': 4,
      'fri-day': 5,
      'satur-day': 6
    };
    const result = weeklyDays
      .map(d => (typeof d === 'string' ? d.toLowerCase().trim() : d))
      .map(d => map[d])
      .filter(v => typeof v === 'number');
    // Deduplicate and sort for stability
    return Array.from(new Set(result)).sort();
  }

  async function buildWeeklyRuleFromTimePattern(companyId, fallbackMode = 'workingday', hour = 10, minute = 0, second = 0) {
    const rule = new schedule.RecurrenceRule();
    rule.hour = hour;
    rule.minute = minute;
    rule.second = second;

    if (fallbackMode === 'everyday') {
      rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
      return rule;
    }

    try {
      // Prefer DefaultPattern if available
      let pattern = await TimePattern.findOne({ company: companyId, DefaultPattern: true, isDeleted: { $ne: true } })
        .lean()
        .exec();
      if (!pattern) {
        // otherwise pick the most recently created for this company
        pattern = await TimePattern.findOne({ company: companyId, isDeleted: { $ne: true } })
          .sort({ createdAt: -1 })
          .lean()
          .exec();
      }
      const weeklyDays = mapWeeklyDaysToNumbers(pattern?.WeeklyDays || []);
      if (weeklyDays.length > 0) {
        rule.dayOfWeek = weeklyDays;
      } else {
        // fallback to Mon–Fri
        rule.dayOfWeek = [1, 2, 3, 4, 5];
      }
    } catch (e) {
      console.warn('Failed to load TimePattern for company', companyId, e?.message);
      rule.dayOfWeek = [1, 2, 3, 4, 5];
    }
    return rule;
  }

  function scheduleJobs(doc) {
    // Cancel and reschedule singleton jobs
    if (scheduledJobs.notifyKnow) scheduledJobs.notifyKnow.cancel();
    if (scheduledJobs.rejectPending) scheduledJobs.rejectPending.cancel();

    // Per-company notifyKnow scheduling based on notification settings
    if (doc && doc.company) {
      const companyId = doc.company._id ? doc.company._id : doc.company;
      const existing = scheduledJobs.notifyKnowByCompany.get(String(companyId));
      if (existing) {
        existing.cancel();
        scheduledJobs.notifyKnowByCompany.delete(String(companyId));
      }
      const mode = doc?.notifications?.reminderDaysMode || 'workingday';
      // Build rule asynchronously using WeeklyDays if mode is workingday, else everyday
      (async () => {
        const rule = await buildWeeklyRuleFromTimePattern(companyId, mode, 10, 0, 0);
        const job = schedule.scheduleJob(rule, async () => {
          await makeKnowLeave();
          await makeKnowWFH();
        });
        scheduledJobs.notifyKnowByCompany.set(String(companyId), job);
      })();
    }

    // Schedule "reject unresponded" job: Every day at 7:00 AM
    scheduledJobs.rejectPending = schedule.scheduleJob("0 7 * * *", async () => {
      await finalResponseLeave();
      await finalResponseWFH();
    });

    // Schedule payslip generation based on company policy payroll.generationDate
    if (doc && doc.company) {
      const companyId = doc.company._id ? doc.company._id : doc.company; // populated or raw id
      const generationDate = doc?.payroll?.generationDate || null;
      schedulePayslipJobForCompany(companyId, generationDate);
    }
  }

  // Hook: after save (insert)
  schema.post("save", function (doc) {
    scheduleJobs(doc);
  });

  // Hook: after update
  schema.post("findOneAndUpdate", function (doc) {
    scheduleJobs(doc);
  });
};
