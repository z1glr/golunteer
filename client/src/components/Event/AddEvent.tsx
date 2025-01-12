import { useEffect, useReducer, useState } from "react";
import { Add } from "@carbon/icons-react";
import zustand from "../../Zustand";
import { getLocalTimeZone, now, ZonedDateTime } from "@internationalized/date";
import {
	Button,
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
} from "@nextui-org/react";
import { apiCall, getTasks, Task } from "@/lib";

interface state {
	date: ZonedDateTime;
	description: string;
	tasks: string[];
}

interface dispatchAction {
	action: "set" | "reset";
	value?: Partial<state>;
}

export default function AddEvent(props: {
	className?: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	// initial state for the inputs
	const initialState: state = {
		date: now(getLocalTimeZone()),
		description: "",
		tasks: [],
	};

	// handle state dispatches
	function reducer(state: state, action: dispatchAction): state {
		if (action.action === "reset") {
			return initialState;
		} else {
			return { ...state, ...action.value };
		}
	}
	const [state, dispatchState] = useReducer(reducer, initialState);
	const [tasks, setTasks] = useState<Record<number, Task>>({});

	// get the available tasks
	useEffect(() => {
		(async () => {
			setTasks(await getTasks());
		})();
	}, []);

	// sends the addEvent request to the backend
	async function addEvent() {
		const data = {
			...state,
			tasks: state.tasks.map((task) => parseInt(task)),
			date: state.date.toAbsoluteString().slice(0, -1),
		};

		const result = await apiCall("POST", "events", undefined, data);

		if (result.ok) {
			zustand.getState().setEvents(await result.json());

			props.onOpenChange(false);

			props.onSuccess?.();
		}
	}

	// reset the state when the modal gets closed
	useEffect(() => {
		if (!props.isOpen) {
			dispatchState({ action: "reset" });
		}
	}, [props.isOpen]);

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
					void addEvent();
				}}
			>
				<ModalContent>
					<ModalHeader>
						<h1 className="text-center text-2xl">Add Event</h1>
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
							onChange={(dt) =>
								!!dt
									? dispatchState({ action: "set", value: { date: dt } })
									: null
							}
						/>
						<Textarea
							variant="bordered"
							placeholder="Description"
							name="description"
							value={state.description}
							onValueChange={(s) =>
								dispatchState({ action: "set", value: { description: s } })
							}
						/>
						<CheckboxGroup
							value={state.tasks}
							name="tasks"
							onValueChange={(s) =>
								dispatchState({ action: "set", value: { tasks: s } })
							}
							validate={(value) =>
								value.length > 0 ? true : "Atleast one task must be selected"
							}
						>
							{tasks !== undefined ? (
								Object.entries(tasks)
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
					<ModalFooter>
						<Button
							color="primary"
							radius="full"
							startContent={<Add size={32} />}
							type="submit"
						>
							Add
						</Button>
					</ModalFooter>
				</ModalContent>
			</Form>
		</Modal>
	);
}
