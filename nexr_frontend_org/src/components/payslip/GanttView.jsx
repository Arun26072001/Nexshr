import { useEffect, useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import Loading from "../Loader";
import NoDataFound from "./NoDataFound";
import { SelectPicker } from "rsuite";

const Default = ({ tasks, isLoading }) => {
    const [taskData, setTaskData] = useState([]);
    const [view, setView] = useState(ViewMode.Day);
    const viewOptions = [
        { label: 'Hour', value: ViewMode.Hour },
        { label: 'Day', value: ViewMode.Day },
        { label: 'Week', value: ViewMode.Week },
        { label: 'Month', value: ViewMode.Month }
    ]

    useEffect(() => {
        const arrangedData = tasks.map((task, index) => {
            const start = new Date(task.from);
            const end = new Date(task.to);
            const durationInHours = (task.estTime || 0);
            const spentHours = task.spend?.timeHolder || 0;

            return {
                id: String(index),
                name: task.title,
                start,
                end,
                type: "task",
                progress: Math.min((spentHours / durationInHours) * 100, 100) || 0,
                isDisabled: false,
                styles: { progressColor: "#34699A", progressSelectedColor: "#113F67" }
            };
        });

        setTaskData(arrangedData);
    }, [tasks]);

    return (
        isLoading ? <Loading height='80vh' /> :
            taskData.length > 0 ?
                <div style={{ padding: "1rem", backgroundColor: "#fff" }}>
                    <div style={{ marginBottom: "1rem", width: 240 }}>
                        <label style={{ marginRight: "0.5rem" }}>View Mode:</label>
                        <SelectPicker
                            data={viewOptions}
                            value={view}
                            onChange={(value) => setView(value)}
                            style={{ width: 160 }}
                            cleanable={false}
                            searchable={false}
                            placement="bottomStart"
                        />
                    </div>

                    <Gantt
                        tasks={taskData}
                        viewMode={view}
                        listCellWidth="155px"
                        columnWidth={70}
                    />
                </div>
                : <NoDataFound message="Task data not found" />
    );
};

export default Default;
