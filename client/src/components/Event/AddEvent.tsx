import { useState } from "react";
import { Add } from "@carbon/icons-react";
import zustand, { EventData, Task, Tasks } from "../../Zustand";
import { Button } from "@nextui-org/button";
import { Checkbox, CheckboxGroup } from "@nextui-org/checkbox";
import { DatePicker } from "@nextui-org/date-picker";
import { getLocalTimeZone, now, ZonedDateTime } from "@internationalized/date";
import { Textarea } from "@nextui-org/input";
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@nextui-org/modal";

interface state {
	date: ZonedDateTime;
	description: string;
	tasks: Task[];
}

export default function AddEvent(props: {
	className?: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}) {
	const [state, setState] = useState<state>({
		date: now(getLocalTimeZone()),
		description: "",
		tasks: [],
	});

	function addEvent() {
		const eventData: EventData = {
			date: state.date.toString(),
			description: state.description,
			id: zustand.getState().events.slice(-1)[0].id + 1,
			tasks: {},
			volunteers: {},
		};

		// add all the tasks
		state.tasks.forEach((task) => {
			eventData.tasks[task] = undefined;
		});

		zustand.getState().addEvent(eventData);
	}

	return (
		<Modal
			isOpen={props.isOpen}
			shadow={"none" as "sm"} // somehow "none" isn't allowed
			onOpenChange={props.onOpenChange}
			backdrop="blur"
			classNames={{
				base: "bg-accent-5 ",
			}}
		>
			<ModalContent>
				<ModalHeader>
					<h1 className="text-2xl">Add Event</h1>
				</ModalHeader>
				<ModalBody>
					<DatePicker
						label="Event date"
						variant="bordered"
						hideTimeZone
						granularity="minute"
						value={state.date}
						onChange={(dt) => (!!dt ? setState({ ...state, date: dt }) : null)}
					/>
					<Textarea
						variant="bordered"
						placeholder="Description"
						value={state.description}
						onValueChange={(desc) => setState({ ...state, description: desc })}
					/>
					<CheckboxGroup
						value={state.tasks}
						onValueChange={(newTasks) =>
							setState({ ...state, tasks: newTasks })
						}
					>
						{Tasks.map((task, ii) => (
							<div key={ii}>
								<Checkbox value={task}>{task}</Checkbox>
							</div>
						))}
					</CheckboxGroup>
				</ModalBody>
				<ModalFooter>
					<Button
						color="primary"
						radius="full"
						startContent={<Add size={32} />}
						onPress={addEvent}
					>
						Add
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
