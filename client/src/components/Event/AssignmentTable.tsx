import { EventData } from "@/Zustand";

export default function AssignmentTable({
	tasks,
}: {
	tasks: EventData["tasks"];
}) {
	return (
		<table>
			<tbody>
				{tasks.map((task) => (
					<tr key={task.taskID}>
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
