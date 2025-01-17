import React, { useEffect, useReducer, useState } from "react";
import {
	getLocalTimeZone,
	now,
	parseDateTime,
	toZoned,
	ZonedDateTime,
} from "@internationalized/date";
import {
	Checkbox,
	CheckboxGroup,
	DatePicker,
	Form,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Spinner,
	Textarea,
} from "@heroui/react";
import { getTasks, Task } from "@/lib";
import { EventData } from "@/Zustand";

export interface EventSubmitData {
	id: number;
	date: string;
	description: string;
	tasks: number[];
}

interface State {
	date: ZonedDateTime;
	description: string;
	tasks: string[];
}

export default function EditEvent(props: {
	children: React.ReactNode;
	footer: React.ReactNode;
	initialState?: EventData;
	className?: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSubmit?: (data: EventSubmitData) => void;
}) {
	const [reverseTasksMap, setReverseTasksMap] = useState<
		Record<string, string>
	>({});
	const [state, dispatchState] = useReducer(
		dispatchStateHandler,
		dispatchStateHandler({} as State, { action: "reset" }),
	);
	const [tasksMap, setTasksMap] = useState<Record<number, Task>>({});

	// initialize the state
	function initialState(): State {
		if (props.initialState !== undefined && reverseTasksMap !== undefined) {
			const { description, date, tasks } = props.initialState;

			return {
				description,
				date: toZoned(parseDateTime(date), getLocalTimeZone()),
				tasks: Object.keys(tasks).map((task) => reverseTasksMap[task]),
			};
		} else {
			return {
				date: now(getLocalTimeZone()),
				description: "",
				tasks: [],
			};
		}
	}

	// update the state if the initialState-prop changes
	useEffect(() => {
		if (props.initialState !== undefined) {
			dispatchState({ action: "reset" });
		}
	}, [props.initialState]);

	// handle dispatch-calls
	function dispatchStateHandler(
		state: State,
		args: { action: "patch" | "reset"; value?: Partial<State> },
	): State {
		if (args.action === "reset") {
			return initialState();
		} else {
			return {
				...state,
				...args.value,
			};
		}
	}

	// shortcut for patching the state
	function patchState(values: Partial<State>) {
		dispatchState({ action: "patch", value: values });
	}

	// handle state dispatches
	// get the available tasks and initialize the state with them
	useEffect(() => {
		(async () => {
			const tasks = await getTasks();

			setTasksMap(tasks);

			setReverseTasksMap(
				Object.fromEntries(
					Object.entries(tasks).map(([id, task]) => {
						return [task.text, id];
					}),
				),
			);
		})();
	}, []);

	// sends the patch-event-request to the backend
	function patchEvent() {
		if (props.initialState !== undefined) {
			const { description, tasks, date } = state;

			const data: EventSubmitData = {
				id: props.initialState?.id,
				description,
				tasks: tasks.map((task) => parseInt(task)),
				date: date.toAbsoluteString().slice(0, -1),
			};

			props.onSubmit?.(data);
		}
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
			<Form
				validationBehavior="native"
				onSubmit={(e) => {
					e.preventDefault();
					void patchEvent();
				}}
			>
				<ModalContent>
					<ModalHeader>
						<h1 className="text-center text-2xl">{props.children}</h1>
					</ModalHeader>

					<ModalBody>
						<DatePicker
							isRequired
							label="Event date"
							name="date"
							variant="bordered"
							hideTimeZone
							granularity="minute"
							value={state.date}
							onChange={(date) => (!!date ? patchState({ date }) : null)}
						/>
						<Textarea
							variant="bordered"
							placeholder="Description"
							name="description"
							value={state.description}
							onValueChange={(description) => patchState({ description })}
						/>
						<CheckboxGroup
							name="tasks"
							value={state.tasks}
							onValueChange={(tasks) => patchState({ tasks })}
							validate={(value) =>
								value.length > 0 ? true : "Atleast one task must be selected"
							}
						>
							{tasksMap !== undefined ? (
								Object.entries(tasksMap)
									.filter(([, task]) => !task.disabled)
									.map(([id, task]) => (
										<div key={id}>
											<Checkbox value={id}>{task.text}</Checkbox>
										</div>
									))
							) : (
								<Spinner label="Loading" />
							)}
						</CheckboxGroup>
					</ModalBody>
					<ModalFooter>{props.footer}</ModalFooter>
				</ModalContent>
			</Form>
		</Modal>
	);
}
