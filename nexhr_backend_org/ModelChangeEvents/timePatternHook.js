const schedule = require("node-schedule");
const axios = require("axios");
const { changeClientTimezoneDate } = require("../Reuseable_functions/reusableFunction");

// Store jobs to clear them when needed
const scheduledTimePatternJobs = new Map();

module.exports = function attachTimePatternHooks(schema) {
  async function scheduleTimePatternJob(pattern) {
    const actualPatternStart = changeClientTimezoneDate(pattern.StartingTime);
    const actualPatternEnd = changeClientTimezoneDate(pattern.FinishingTime);
    const [startingHour, startingMin] = [actualPatternStart.getHours(), actualPatternStart.getMinutes()];
    const [finishingHour, finishingMin] = [actualPatternEnd.getHours(), actualPatternEnd.getMinutes()];

    // Clear existing jobs for this pattern
    if (scheduledTimePatternJobs.has(pattern._id.toString())) {
      const jobs = scheduledTimePatternJobs.get(pattern._id.toString());
      jobs.forEach((job) => job.cancel());
    }

    // Schedule login job
    const loginJob = schedule.scheduleJob(`0 ${startingMin} ${startingHour} * * 1-5`, async function () {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/ontime/login`);
        console.log("Login Triggered:", response.data.message);
      } catch (error) {
        console.error("Login Error:", error.message);
      }
    });

    // Schedule leave job
    const leaveJob = schedule.scheduleJob(`0 ${finishingMin - 5} ${finishingHour} * * *`, async function () {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/not-login/apply-leave/${pattern._id}`);
        console.log("Apply Leave for Not-login Triggered:", response.data.message);
      } catch (error) {
        console.error("Logout Error:", error);
      }
    });

    // Store both jobs
    scheduledTimePatternJobs.set(pattern._id.toString(), [loginJob, leaveJob]);
  }

  // Hook: on save
  schema.post("save", function () {
    scheduleTimePatternJob(this);
  });

  // Hook: on update
  schema.post("findOneAndUpdate", async function (doc) {
    if (doc) {
      scheduleTimePatternJob(doc);
    }
  });
};
