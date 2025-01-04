import { EventData } from "../Zustand";

export default function Event(props: EventData) {
	return (
		<div
			key={props.id}
			className="flex w-64 flex-col gap-2 rounded-xl bg-accent-5 p-4"
		>
			<h3 className="bold mb-1 text-2xl">{props.date}</h3>
			<div>{props.description}</div>

			<table>
				<caption>
					<h4>Task assignment</h4>
				</caption>
				<tbody>
					{Object.entries(props.tasks).map(([task, person], ii) => (
						<tr key={ii}>
							<th className="pr-4 text-left">{task}</th>
							<td>{person ?? <span className="text-primary">missing</span>}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
