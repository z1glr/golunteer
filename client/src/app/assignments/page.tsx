"use client";

import AddEvent from "@/components/Event/AddEvent";
import EditEvent from "@/components/Event/EditEvent";
import LocalDate from "@/components/LocalDate";
import { apiCall, getAvailabilities, getTasks, QueryParams } from "@/lib";
import { EventData } from "@/Zustand";
import {
	Add,
	Copy,
	Edit,
	NotAvailable,
	Renew,
	TrashCan,
} from "@carbon/icons-react";
import {
	Button,
	ButtonGroup,
	DateValue,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableColumnProps,
	TableHeader,
	TableRow,
	Tooltip,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import React, { Key, useEffect, useState } from "react";
import { Availability } from "../admin/(availabilities)/AvailabilityEditor";
import VolunteerSelector from "./VolunteerSelector";
import { getLocalTimeZone, today } from "@internationalized/date";
import DateEventsSince from "@/components/DateEventsSince";
import FilterPopover from "@/components/FilterPopover";

export type EventWithAvailabilities = EventData & {
	availabilities: Record<string, string[]>;
};

export default function AdminPanel() {
	const [showAddEvent, setShowAddEvent] = useState(false);
	const [sinceDate, setSinceDate] = useState<DateValue | null>(
		today(getLocalTimeZone()),
	);
	const [editEvent, setEditEvent] = useState<EventData | undefined>();
	const [deleteEvent, setDeleteEvent] = useState<EventData | undefined>();
	const [availabilityMap, setAvailabilityMap] = useState<
		Record<number, Availability>
	>({});

	// get the available tasks and craft them into the headers
	const headers = useAsyncList<{
		key: string | number;
		label: string;
		align?: string;
	}>({
		async load() {
			const tasks = await getTasks();

			const headers = {
				items: [
					{ key: "date", label: "Date" },
					{ key: "description", label: "Description" },
					...tasks
						.filter((task) => task.enabled)
						.map((task) => ({
							label: task.taskName,
							key: task.taskID ?? -1,
							align: "center",
						})),
					{ key: "actions", label: "Action", align: "center" },
				],
			};

			return headers;
		},
	});

	// get the individual events
	const events = useAsyncList<EventWithAvailabilities>({
		async load() {
			let params: QueryParams | undefined = undefined;

			if (sinceDate) {
				params = {
					since: sinceDate,
				};
			}

			const result = await apiCall<EventWithAvailabilities[]>(
				"GET",
				"events/availabilities",
				params,
			);

			if (result.ok) {
				const data = await result.json();

				return { items: data };
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

	// retrieve the availabilites and store them in a map
	useEffect(() => {
		(async () => {
			setAvailabilityMap(
				Object.fromEntries(
					(await getAvailabilities()).map((a) => [a.availabilityID, a]),
				),
			);
		})();
	}, []);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => void events.reload(), [sinceDate]);

	function getAvailabilityById(availabilityID: number): Availability {
		return availabilityMap[availabilityID];
	}

	// send a command to the backend to assign a volunteer to a task
	// send a delete request to the backend and close the popup on success
	async function sendDeleteEvent() {
		if (deleteEvent !== undefined) {
			const result = await apiCall("DELETE", "event", {
				eventID: deleteEvent.eventID,
			});

			if (result.ok) {
				// store the received events
				events.reload();

				// close the delete-confirmaton
				setDeleteEvent(undefined);
			}
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
				return (
					<div className="max-w-32 whitespace-pre-wrap italic">
						{event[key]}
					</div>
				);
			case "actions":
				return (
					<div className="flex justify-end">
						<ButtonGroup isIconOnly variant="light" size="sm">
							<Button
								onPress={() => {
									setEditEvent(event);
								}}
							>
								<Tooltip content="Edit event">
									<Edit />
								</Tooltip>
							</Button>
							<Button onPress={() => alert("implement")}>
								<Tooltip content="Duplicate event">
									<Copy />
								</Tooltip>
							</Button>
							<Button
								color="danger"
								onPress={() => {
									setDeleteEvent(event);
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
				const task = event.tasks.find((t) => t.taskID == key);

				if (!!task) {
					return (
						<VolunteerSelector
							event={event}
							task={task}
							getAvailabilityById={getAvailabilityById}
							onReloadRequest={events.reload}
						/>
					);
				} else {
					return <NotAvailable className="mx-auto text-foreground-300" />;
				}
		}
	}

	const topContent = (
		<div className="flex items-center">
			<div>
				<Button
					color="primary"
					startContent={<Add size={32} />}
					onPress={() => setShowAddEvent(true)}
				>
					Add
				</Button>
			</div>
			<FilterPopover className="ml-auto">
				<DateEventsSince sinceDate={sinceDate} setSinceDate={setSinceDate} />
			</FilterPopover>
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
				isStriped
				sortDescriptor={events.sortDescriptor}
				classNames={{
					wrapper: "bg-accent-4",
					tr: "even:bg-accent-5 ",
					th: "font-subheadline text-xl text-accent-1 bg-transparent ",
					thead: "[&>tr]:first:!shadow-border",
				}}
				onSortChange={events.sort}
				className="w-fit max-w-full"
			>
				<TableHeader columns={headers.items}>
					{(task) => (
						<TableColumn
							allowsSorting={task.key === "date"}
							key={task.key}
							align={task.align as TableColumnProps<string>["align"]}
						>
							{task.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody items={events.items} emptyContent={"No events scheduled"}>
					{(event) => (
						<TableRow key={event.eventID}>
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

			<EditEvent
				isOpen={editEvent !== undefined}
				onOpenChange={(isOpen) => (!isOpen ? setEditEvent(undefined) : null)}
				onSuccess={() => {
					setEditEvent(undefined);
					events.reload();
				}}
				value={editEvent}
				footer={
					<Button
						color="primary"
						radius="full"
						startContent={<Renew />}
						type="submit"
					>
						Update
					</Button>
				}
			>
				Edit Event
			</EditEvent>

			<Modal
				isOpen={!!deleteEvent}
				onOpenChange={(isOpen) => (!isOpen ? setDeleteEvent(undefined) : null)}
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
								{deleteEvent?.date}
							</LocalDate>
						</span>{" "}
						will be deleted.
					</ModalBody>
					<ModalFooter>
						<Button
							variant="bordered"
							onPress={() => setDeleteEvent(undefined)}
						>
							Cancel
						</Button>
						<Button
							startContent={<TrashCan />}
							color="danger"
							onPress={() => sendDeleteEvent()}
						>
							Delete event
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}
