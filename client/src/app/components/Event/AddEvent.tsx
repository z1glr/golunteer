import { useState } from "react";
import CheckBox from "../CheckBox";
import { AddLarge } from "@carbon/icons-react";
import Button from "../Button";
import zustand, { EventData, ISODate, Task, Tasks } from "../Zustand";

interface state {
	date: string;
	description: string;
	tasks: Task[];
}

export default function AddEvent(props: {
	className?: string;
	onClose: () => void;
}) {
	const [state, setState] = useState<state>({
		date: ISODate(new Date()),
		description: "",
		tasks: [],
	});

	function toggleTask(task: Task) {
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

	function addEvent() {
		const eventData: EventData = {
			date: state.date,
			description: state.description,
			id: zustand.getState().events.slice(-1)[0].id + 1,
			tasks: {},
		};

		// add all the tasks
		state.tasks.forEach((task) => {
			eventData.tasks[task] = undefined;
		});

		zustand.getState().addEvent(eventData);

		props.onClose();
	}

	return (
		<div
			className={`${props.className ?? ""} flex w-64 flex-col gap-2 rounded-xl bg-accent-5 p-4`}
		>
			<h1 className="text-2xl">Add Event</h1>
			<input
				type="date"
				value={state.date}
				onChange={(e) => console.log(e.target.value)}
			/>
			<input
				type="text"
				placeholder="Description"
				value={state.description}
				onChange={(e) => setState({ ...state, description: e.target.value })}
			/>
			{Tasks.map((task, ii) => (
				<div
					key={ii}
					onClick={() => toggleTask(task)}
					className="flex cursor-default items-center gap-2"
				>
					<CheckBox state={state.tasks.includes(task)} />
					{task}
				</div>
			))}
			<Button
				className="ml-auto flex w-fit items-center justify-center gap-2 pr-4"
				onClick={addEvent}
			>
				<AddLarge size={32} />
				Add
			</Button>
		</div>
	);
}
