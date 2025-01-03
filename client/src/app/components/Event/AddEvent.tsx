import { useState } from "react";
import CheckBox from "../CheckBox";
import { Task } from "./Event";
import { AddLarge } from "@carbon/icons-react";
import Button from "../Button";

interface state {
	date: Date;
	description: string;
	tasks: string[];
}

export default function AddEvent(props: { className?: string }) {
	const availableTasks = Object.keys(Task).filter((tt) => isNaN(Number(tt)));

	const [state, setState] = useState<state>({
		date: new Date(),
		description: "",
		tasks: [],
	});

	function toggleTask(task: string) {
		const new_tasks = state.tasks.slice();

		const index = new_tasks.indexOf(task);

		if (index != -1) {
			new_tasks.splice(index, 1);
		} else {
			new_tasks.push(task);
		}

		setState({
			...state,
			tasks: new_tasks,
		});
	}

	return (
		<div
			className={`${props.className ?? ""} flex w-64 flex-col gap-2 rounded-xl bg-accent-5 p-4`}
		>
			<h1 className="text-2xl">Add Event</h1>
			<input type="date" />
			<input type="text" placeholder="Description" />
			{availableTasks.map((tt, ii) => (
				<div key={ii}>
					<label className="flex items-center gap-2">
						<input type="checkbox" className="hidden" />
						<CheckBox
							state={state.tasks.includes(tt)}
							onClick={() => toggleTask(tt)}
						/>
						{tt}
					</label>
				</div>
			))}
			<Button className="ml-auto flex w-fit items-center justify-center gap-2 pr-4">
				<AddLarge size={32} />
				Add
			</Button>
		</div>
	);
}
