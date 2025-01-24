import { classNames } from "@/lib";
import { EventData } from "@/Zustand";

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
		<table className={className}>
			<tbody>
				{tasks.map((task) => (
					<tr
						key={task.taskID}
						className={classNames({
							"text-danger":
								task.userName === highlightUser ||
								task.taskName === highlightTask,
						})}
					>
						<th className="pr-4 text-left">{task.taskName}</th>
						<td>
							{task.userName ?? (
								<span className="italic text-highlight">missing</span>
							)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
