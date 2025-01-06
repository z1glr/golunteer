import { EventData } from "@/Zustand";

export default function AssignmentTable({
	tasks,
}: {
	tasks: EventData["tasks"];
}) {
	return (
		<table>
			<tbody>
				{Object.entries(tasks).map(([task, person]) => (
					<tr key={task}>
						<th className="pr-4 text-left">{task}</th>
						<td>
							{person ?? <span className="italic text-highlight">missing</span>}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
