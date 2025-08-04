const schedule = require("node-schedule");
const { Team } = require("../models/TeamModel");
const { Employee } = require("../models/EmpModel");
const { LeaveApplication } = require("../models/LeaveAppModel");
const { ClockIns } = require("../models/ClockInsModel");
const { RoleAndPermission } = require("../models/RoleModel");
const { Department } = require("../models/DepartmentModel");
const { Position } = require("../models/PositionModel");
const { WFHApplication } = require("../models/WFHApplicationModel");
const { TimePattern } = require("../models/TimePatternModel");
const { WorkPlace } = require("../models/WorkPlaceModel");
const { Holiday } = require("../models/HolidayModel");
const { EmailTemplate } = require("../models/EmailTemplateModel");
const { Comment } = require("../models/CommentModel");
const { Announcement } = require("../models/AnnouncementModel");
const { LeaveType } = require("../models/LeaveTypeModel");
const { Task } = require("../models/TaskModel");
const { Project } = require("../models/ProjectModel");
const { Report } = require("../models/ReportModel");
const { Payslip } = require("../models/PaySlipModel");

// Import your models here


// All models in a single array
const modelsList = [
  Team,
  Employee,
  LeaveApplication,
  ClockIns,
  RoleAndPermission,
  Department,
  Position,
  WFHApplication,
  TimePattern,
  WorkPlace,
  Holiday,
  EmailTemplate,
  Comment,
  Announcement,
  LeaveType,
  Task,
  Project,
  Report,
  Payslip
];

// 🧹 Delete documents with isDeleted: true & updatedAt older than 9 days
const deleteOldSoftDeletedDocs = async () => {
  const nineDaysAgo = new Date();
  nineDaysAgo.setDate(nineDaysAgo.getDate() - 9);

  for (const model of modelsList) {
    try {
      const result = await model.deleteMany({
        isDeleted: true,
        updatedAt: { $lte: nineDaysAgo }
      });
      if (result.deletedCount > 0) {
        console.log(`[${model.modelName}] ➜ Deleted ${result.deletedCount} old soft-deleted docs`);
      }
    } catch (err) {
      console.error(`[${model.modelName}] ➜ Cleanup error:`, err.message);
    }
  }
};

// ⏰ Schedule the job to run every day at 2:30 AM
schedule.scheduleJob("30 2 * * *", deleteOldSoftDeletedDocs);

// 🔁 Trigger cleanup when any model is updated (via findOneAndUpdate)
for (const model of modelsList) {
  model.schema.post("findOneAndUpdate", async function () {
    await deleteOldSoftDeletedDocs();
  });
}

module.exports = deleteOldSoftDeletedDocs; // optional if you want to trigger manually elsewhere
