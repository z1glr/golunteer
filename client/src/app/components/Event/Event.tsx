export enum Task {
	Audio,
	Livestream,
	Camera,
	Light,
	StreamAudio,
}

export interface EventData {
	id: number;
	date: Date;
	tasks: Partial<Record<Task, string | undefined>>;
	description: string;
}

export default function Event(props: EventData) {
	return (
		<div key={props.id} className="w-64 rounded-xl bg-accent-5 p-4">
			<h3 className="bold mb-1 text-2xl">{props.date.toLocaleDateString()}</h3>
			{props.description !== undefined ? <div>{props.description}</div> : null}
			<table className="mt-4">
				<tbody>
					{Object.entries(props.tasks).map(([task, person], ii) => (
						<tr key={ii}>
							<th className="pr-4 text-left">
								{Task[task as unknown as Task]}
							</th>
							<td>{person ?? <span className="text-primary">missing</span>}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
