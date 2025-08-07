const schedule = require("node-schedule");
const axios = require("axios");

module.exports = function attachSettingsHooks(schema) {
  const scheduledJobs = {
    notifyKnow: null,
    rejectPending: null,
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
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/leave-application/reject-leave`);
      console.log(res.data);
    } catch (error) {
      console.log("error in finalResponseLeave", error?.response?.data?.error || error.message);
    }
  }

  async function finalResponseWFH() {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/wfh-application/reject-wfh`);
      console.log(res.data);
    } catch (error) {
      console.log("error in finalResponseWFH", error?.response?.data?.error || error.message);
    }
  }

  function scheduleJobs(doc) {
    // Cancel existing jobs if already scheduled
    if (scheduledJobs.notifyKnow) scheduledJobs.notifyKnow.cancel();
    if (scheduledJobs.rejectPending) scheduledJobs.rejectPending.cancel();

    // Schedule "makeKnow" job: Mon–Fri at 10:00 AM
    scheduledJobs.notifyKnow = schedule.scheduleJob("0 10 * * 1-5", async () => {
      await makeKnowLeave();
      await makeKnowWFH();
    });

    // Schedule "reject unresponded" job: Every day at 7:00 AM
    scheduledJobs.rejectPending = schedule.scheduleJob("0 7 * * *", async () => {
      await finalResponseLeave();
      await finalResponseWFH();
    });
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
