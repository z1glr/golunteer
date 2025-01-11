"use client";

import AddEvent from "@/components/Event/AddEvent";
import LocalDate from "@/components/LocalDate";
import { apiCall, getTasks } from "@/lib";
import { EventData } from "@/Zustand";
import {
	Add,
	AddLarge,
	Copy,
	Edit,
	NotAvailable,
	TrashCan,
} from "@carbon/icons-react";
import {
	Button,
	ButtonGroup,
	Chip,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
} from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";
import React, { Key, useState } from "react";

type EventWithAvailabilities = EventData & { availabilities: string[] };

function availability2Tailwind(availability?: Availability) {
	switch (availability) {
		case "yes":
			return "";
		default:
			return "italic";
	}
}

function availability2Color(availability?: Availability) {
	switch (availability) {
		case "yes":
			return "default";
		case "maybe":
			return "warning";
		default:
			return "danger";
	}
}

export default function AdminPanel() {
	// get the available tasks and craft them into the headers
	const headers = useAsyncList({
		async load() {
			const tasks = await getTasks();

			return {
				items: [
					{ key: "date", label: "Date" },
					{ key: "description", label: "Description" },
					...Object.values(tasks)
						.filter((task) => !task.disabled)
						.map((task) => ({ label: task.text, key: task.text })),
					{ key: "actions", label: "Action" },
				],
			};
		},
	});

	// get the individual events
	const events = useAsyncList<EventWithAvailabilities>({
		async load() {
			const result = await apiCall<EventWithAvailabilities[]>(
				"GET",
				"events/availabilities",
			);

			if (result.ok) {
				return { items: await result.json() };
			} else {
				return { items: [] };
			}
		},
		async sort({ items, sortDescriptor }) {
			return {
				items: items.sort((a, b) => {
					let cmp = 0;

					// if it is the date-column, convert to a date
					if (sortDescriptor.column === "date") {
						const first = a[sortDescriptor.column];
						const second = b[sortDescriptor.column];

						cmp = first < second ? -1 : 1;
					}

					if (sortDescriptor.direction === "descending") {
						cmp *= -1;
					}

					return cmp;
				}),
			};
		},
	});

	// send a delete request to the backend and close the popup on success
	async function deleteEvent(eventId: number) {
		const result = await apiCall("DELETE", "event", { id: eventId });

		if (result.ok) {
			// store the received events
			events.reload();

			setShowDeleteConfirm(false);
		}
	}

	function getKeyValue(
		event: EventWithAvailabilities,
		key: Key,
	): React.ReactNode {
		switch (key) {
			case "date":
				return (
					<LocalDate
						options={{ dateStyle: "medium", timeStyle: "short" }}
						className="font-bold"
					>
						{event[key]}
					</LocalDate>
				);
			case "description":
				return <span className="whitespace-pre-wrap italic">{event[key]}</span>;
			case "actions":
				return (
					<div className="flex justify-end">
						<ButtonGroup isIconOnly variant="light" size="sm">
							<Button>
								<Tooltip content="Edit event">
									<Edit />
								</Tooltip>
							</Button>
							<Button>
								<Tooltip content="Duplicate event">
									<Copy />
								</Tooltip>
							</Button>
							<Button
								color="danger"
								onPress={() => {
									setActiveEvent(event);
									setShowDeleteConfirm(true);
								}}
							>
								<Tooltip content="Delete event">
									<TrashCan />
								</Tooltip>
							</Button>
						</ButtonGroup>
					</div>
				);
			default:
				// only show the selector, if the task is needed for the event
				if (Object.keys(event.tasks).includes(key as string)) {
					return (
						<Dropdown>
							<DropdownTrigger>
								{!!event.tasks[key as string] ? (
									<Chip onClose={() => alert("implement")}>
										{event.tasks[key as string]}
									</Chip>
								) : (
									<Button isIconOnly size="sm" radius="md" variant="flat">
										<AddLarge className="mx-auto" />
									</Button>
								)}
							</DropdownTrigger>
							<DropdownMenu>
								{Object.entries(event.availabilities).map(
									([volunteer, availability]) => (
										<DropdownItem
											key={volunteer}
											// color={availability2Color(availability)}
											className={[
												// "text-" + availability2Color(availability),
												// availability2Tailwind(availability),
											].join(" ")}
										>
											{volunteer} ({availability})
										</DropdownItem>
									),
								)}
							</DropdownMenu>
						</Dropdown>
						// <Select
						// 	aria-label={`User selection for task ${key} and event ${event.date}`}
						// 	variant="underlined"
						// 	fullWidth
						// 	selectedKeys={new Set([event.tasks[key as string] ?? ""])}
						// 	classNames={{
						// 		popoverContent: "w-fit",
						// 		value: "mr-6",
						// 		label: "mr-6",
						// 	}}
						// 	className="[&_*]:overflow-visible"
						// >
						// 	{Object.entries(event.availabilities).map(
						// 		([volunteer, availability]) => (
						// 			<SelectItem
						// 				key={volunteer}
						// 				// color={availability2Color(availability)}
						// 				className={[
						// 					// "text-" + availability2Color(availability),
						// 					// availability2Tailwind(availability),
						// 				].join(" ")}
						// 			>
						// 				{volunteer} ({availability})
						// 			</SelectItem>
						// 		),
						// 	)}
						// </Select>
					);
				} else {
					return <NotAvailable className="mx-auto text-foreground-300" />;
				}
		}
	}

	const [showAddEvent, setShowAddEvent] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [activeEvent, setActiveEvent] = useState<EventData | undefined>();

	const topContent = (
		<div>
			<Button
				color="primary"
				startContent={<Add size={32} />}
				onPress={() => setShowAddEvent(true)}
			>
				Add
			</Button>
		</div>
	);

	return (
		<div className="relative flex flex-col items-center">
			<h2 className="mb-4 text-center text-4xl">Event Managment</h2>

			<Table
				aria-label="Table with all the events"
				shadow="none"
				topContent={topContent}
				topContentPlacement="outside"
				isHeaderSticky
				sortDescriptor={events.sortDescriptor}
				onSortChange={events.sort}
				classNames={{
					wrapper: "bg-accent-4",
					tr: "even:bg-accent-5 ",
					th: "font-subheadline text-xl text-accent-1 bg-transparent ",
					thead: "[&>tr]:first:!shadow-border",
				}}
				className="w-fit"
			>
				<TableHeader columns={headers.items}>
					{(task) => (
						<TableColumn
							allowsSorting={task.key === "date"}
							key={task.key}
							className=""
						>
							{task.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody items={events.items} emptyContent={"No events scheduled"}>
					{(event) => (
						<TableRow key={event.id}>
							{(columnKey) => (
								<TableCell>{getKeyValue(event, columnKey)}</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddEvent
				isOpen={showAddEvent}
				onOpenChange={setShowAddEvent}
				onSuccess={() => events.reload()}
			/>

			{activeEvent !== undefined ? (
				<Modal
					isOpen={showDeleteConfirm}
					onOpenChange={setShowDeleteConfirm}
					shadow={"none" as "sm"}
					backdrop="blur"
					className="bg-accent-5"
				>
					<ModalContent>
						<ModalHeader>
							<h1 className="text-2xl">Confirm event deletion</h1>
						</ModalHeader>
						<ModalBody>
							The event{" "}
							<span className="font-numbers text-accent-1">
								<LocalDate options={{ dateStyle: "long", timeStyle: "short" }}>
									{activeEvent.date}
								</LocalDate>
							</span>{" "}
							will be deleted.
						</ModalBody>
						<ModalFooter>
							<Button
								startContent={<TrashCan />}
								color="danger"
								onPress={() => deleteEvent(activeEvent.id)}
							>
								Delete event
							</Button>
							<Button
								variant="bordered"
								onPress={() => setShowDeleteConfirm(false)}
							>
								Cancel
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			) : null}
		</div>
	);
}
