import { classNames } from "@/lib";
import { EventData } from "@/Zustand";
import { Fragment } from "react";

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
			<div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
				{tasks.map((task) => (
					<Fragment key={task.taskID}>
						<div
							className={classNames(
								classNames({
									"text-danger":
										task.userName === highlightUser ||
										task.taskName === highlightTask,
								}),
								"text-sm font-bold",
							)}
						>
							{task.taskName}
						</div>
						{task.userName ?? (
							<span className="text-sm italic text-highlight">missing</span>
						)}
					</Fragment>
				))}
			</div>
		</div>
	);
}
