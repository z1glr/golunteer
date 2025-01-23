import React, { useState } from "react";
import {
	getLocalTimeZone,
	now,
	parseAbsoluteToLocal,
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
import { EventData } from "@/Zustand";
import { useAsyncList } from "@react-stately/data";
import { getTasks } from "@/lib";

export interface EventSubmitData {
	eventID: number;
	date: string;
	description: string;
	tasks: number[];
}

export default function EventEditor(props: {
	header: React.ReactNode;
	footer: React.ReactNode;
	value?: EventData;
	className?: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSubmit?: (data: EventSubmitData) => void;
}) {
	const [date, setDate] = useState<ZonedDateTime | null>(
		!!props.value?.date
			? parseAbsoluteToLocal(props.value?.date)
			: now(getLocalTimeZone()),
	);
	const [description, setDescription] = useState(
		props.value?.description ?? "",
	);
	const [eventTasks, setEventTasks] = useState<string[]>(
		props.value?.tasks.map((k) => k.taskID.toString()) ?? [],
	);

	const tasks = useAsyncList({
		async load() {
			return {
				items: await getTasks(),
			};
		},
	});

	function onSubmit() {
		if (!!props.onSubmit && !!date) {
			props.onSubmit({
				eventID: props.value?.eventID ?? -1,
				date: date.toAbsoluteString(),
				description,
				tasks: eventTasks.map((t) => parseInt(t)),
			});
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
					onSubmit();
				}}
			>
				<ModalContent>
					<ModalHeader>
						<h1 className="text-center text-2xl">{props.header}</h1>
					</ModalHeader>

					<ModalBody>
						<DatePicker
							isRequired
							label="Event date"
							name="date"
							variant="bordered"
							hideTimeZone
							granularity="minute"
							value={date}
							onChange={setDate}
						/>
						<Textarea
							variant="bordered"
							placeholder="Description"
							name="description"
							value={description}
							onValueChange={setDescription}
						/>
						<CheckboxGroup
							name="tasks"
							value={eventTasks}
							onValueChange={setEventTasks}
							validate={(value) =>
								value.length > 0 ? true : "Atleast one task must be selected"
							}
						>
							{!!tasks ? (
								tasks.items
									?.filter((task) => task.enabled)
									.map((task) => (
										<div key={task.taskID}>
											<Checkbox value={task.taskID?.toString()}>
												{task.taskName}
											</Checkbox>
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
