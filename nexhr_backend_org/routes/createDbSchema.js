const mongoose = require('mongoose');
const { getOrgDB } = require('../../config/DynamicDb');

// Import all schemas
const campfireChatSchema = require('../CampfireSchema/campfireChat');
const campfireMessage = require('../CampfireSchema/campfireMessage');
const invitationSchema = require('../userInviteeSchema');
const preferenceSchema = require('../userPreference/Preference');
const { ProjectSchema } = require('../projectSchema');
const { MessageBoardSchema } = require('../MessageSchema/MessageBoardMessage');
const { messageBoardMessages } = require('../MessageSchema/Message');
const { CategorySchema } = require('../MessageSchema/commentSchema');
const { todoListSchema } = require('../To-dos/todoListSchema');
const { task } = require('../To-dos/task');
const { FolderSchema } = require('../Docs&FilesSchema/FolderSchema');
const { DocumentSchema } = require('../Docs&FilesSchema/DocumentSchema');
const { FileSchema } = require('../Docs&FilesSchema/FileSchema');
const { DocsFilesCommentSchema } = require('../Docs&FilesSchema/DocsFilesCommentSchema');
const { DocsViewModeSchema } = require('../Docs&FilesSchema/DocsViewModeSchema');
const { ScheduleSchema } = require('../Schedule/ScheduleSchema');
const { ScheduleCommentsSchema } = require('../Schedule/ScheduleComments');
const { pingMessageSchema } = require('../pingSchema/pingMessageModel');
const { pingchatSchema } = require('../pingSchema/pingChatModel');
const { TaskCommentSchema } = require('../To-dos/TaskCommentsSchema');
const { TodoCommentSchema } = require('../To-dos/TodoCommentSchema');
const { todoViewModeSchema } = require('../To-dos/TodoViewModeSchema');
const { notificationSchema } = require('../Notification/NotificationSchema');
const { cardTriageSchema } = require('../CardTableSchema/CardTriageSchema');
const { CardtableSchema } = require('../CardTableSchema/CardTableSchema');
const { RoleAndPermissionSchema } = require('../role');
const checkInSchema = require('../Check-ins-Schema/Auto-check-insModel');
const { answerSchema } = require('../Check-ins-Schema/AnswerSchema');

// Define static collection names
const schemas = [
    { name: 'campChats', schema: campfireChatSchema },
    { name: 'campMessages', schema: campfireMessage },
    { name: 'invitations', schema: invitationSchema },
    { name: 'preference', schema: preferenceSchema },
    { name: 'projects', schema: ProjectSchema },
    { name: 'messageboard', schema: MessageBoardSchema },
    { name: 'messageComments', schema: messageBoardMessages },
    { name: 'messageCategory', schema: CategorySchema },
    { name: 'todoList', schema: todoListSchema },
    { name: 'task', schema: task },
    { name: 'documents', schema: DocumentSchema },
    { name: 'docFolders', schema: FolderSchema },
    { name: 'docFiles', schema: FileSchema },
    { name: 'docFilecomments', schema: DocsFilesCommentSchema },
    { name: 'docViewMode', schema: DocsViewModeSchema },
    { name: 'ScheduleEvents', schema: ScheduleSchema },
    { name: 'ScheduleEventComments', schema: ScheduleCommentsSchema },
    { name: 'PingChats', schema: pingchatSchema },
    { name: 'PingMessages', schema: pingMessageSchema },
    { name: 'TodoComments', schema: TodoCommentSchema },
    { name: 'TaskComments', schema: TaskCommentSchema },
    { name: 'todoViewModeSchema', schema: todoViewModeSchema },
    { name: 'Notifications', schema: notificationSchema },
    { name: 'cardTriageSchema', schema: cardTriageSchema },
    { name: 'CardtableSchema', schema: CardtableSchema },
    { name: 'Roles', schema: RoleAndPermissionSchema },
    { name: 'Autocheckins', schema: checkInSchema },
    { name: 'checkInAnswers', schema: answerSchema },
];

/**
 * Function to dynamically create collections for an organization.
 * @param {string} organizationId - Organization's unique database identifier.
 * @returns {object} - Object containing the created models.
 */
const createOrganizationCollections = async (organizationId) => {
    console.log("Initializing models for orgId:", organizationId);

    const models = {};
    // connect with current org of databse
    const db = await getOrgDB(organizationId);
    console.log(db);

    for (const { name, schema } of schemas) {
        let finalSchema = schema;

        // If schema is a function, call it with name
        if (typeof schema === 'function') {
            finalSchema = schema(name);
        }

        if (!db.models[name]) {
            // Only register if not already registered
            models[name] = db.model(name, finalSchema, name);
        } else {
            models[name] = db.models[name]; // Use existing model
        }
    }

    return models;
};

module.exports = createOrganizationCollections;
