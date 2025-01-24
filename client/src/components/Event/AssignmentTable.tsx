import { classNames } from "@/lib";
import { EventData } from "@/Zustand";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/react";

export default function AssignmentTable({
	tasks,
	highlightTask,
	highlightUser,
	className,
}: {
	tasks: EventData["tasks"];
	highlightUser?: string;
	highlightTask?: string;
	className?: string;
}) {
	return (
		<div className={className}>
			<h4 id="assignmentTableHeader">Tasks</h4>
			<Table
				aria-labelledby="assignmentTableHeader"
				hideHeader
				removeWrapper
				classNames={{
					td: "text-base",
				}}
				shadow="none"
				title="Tasks"
			>
				<TableHeader>
					<TableColumn>Task</TableColumn>
					<TableColumn>Volunteer</TableColumn>
				</TableHeader>
				<TableBody items={tasks}>
					{(task) => (
						<TableRow
							key={task.taskID}
							className={classNames({
								"text-danger":
									task.userName === highlightUser ||
									task.taskName === highlightTask,
							})}
						>
							<TableCell className="font-bold">{task.taskName}</TableCell>
							<TableCell>
								{task.userName ?? (
									<span className="italic text-highlight">missing</span>
								)}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
