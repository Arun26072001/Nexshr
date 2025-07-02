import { useEffect, useState } from 'react';
import {
    GanttComponent,
    ColumnsDirective,
    ColumnDirective
} from '@syncfusion/ej2-react-gantt';
import Loading from '../Loader';
import NoDataFound from './NoDataFound';

const Default = ({ tasks, isLoading }) => {
    const [taskData, setTaskData] = useState([]);

    useEffect(() => {
        const arrangedData = tasks.map((task, index) => ({
            TaskID: index,
            TaskName: task.title,
            StartDate: new Date(task.from),
            EndDate: new Date(task.to),
            Duration: (task.estTime || 0) / 24,
            Progress: (task.spend.timeHolder || 0) + "hrs",
            Status: task.status,
            child: []
        }));
        setTaskData(arrangedData)
    }, [tasks]);

    const taskFields = {
        id: 'TaskID',
        name: 'TaskName',
        startDate: 'StartDate',
        endDate: 'EndDate',
        duration: 'Duration',
        progress: 'Progress',
        status: 'Status',
        child: 'subtasks'
    };

    const labelSettings = {
        leftLabel: 'TaskName',
    };

    return (
        isLoading ? <Loading height='80vh' /> :
            taskData.length > 0 ?
                <div className='control-pane'>
                    <div className='control-section'>
                        <GanttComponent
                            id='Default'
                            dataSource={taskData}
                            treeColumnIndex={1}
                            taskFields={taskFields}
                            labelSettings={labelSettings}
                            height='410px'
                        >
                            <ColumnsDirective>
                                <ColumnDirective field='TaskID' width='80' />
                                <ColumnDirective field='TaskName' headerText='Title' width='250' clipMode='EllipsisWithTooltip' />
                                <ColumnDirective field='StartDate' />
                                <ColumnDirective field='Duration' />
                                <ColumnDirective field='Progress' />
                                <ColumnDirective field='Predecessor' />
                            </ColumnsDirective>
                        </GanttComponent>
                    </div>
                </div> : <NoDataFound message={"Task data not found"} />
    );
};

export default Default;
