"use client";

import AddEvent from "@/components/Event/AddEvent";
import LocalDate from "@/components/LocalDate";
import zustand, { Availability, EventData, Task, Tasks } from "@/Zustand";
import { Add, Copy, Edit, TrashCan } from "@carbon/icons-react";
import {
	Button,
	ButtonGroup,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
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
	const tasks = [
		{ key: "date", label: "Date" },
		{ key: "description", label: "Description" },
		...Tasks.map((task) => ({ label: task, key: task })),
		{ key: "actions", label: "Action" },
	];

	const list = useAsyncList({
		async load() {
			return {
				items: [...zustand.getState().events],
			};
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

	function getKeyValue(event: EventData, key: Key): React.ReactNode {
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
				return <span className="italic">{event[key]}</span>;
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
				return (
					<Select
						variant="underlined"
						fullWidth
						selectedKeys={new Set([event.tasks[key as Task] ?? ""])}
						classNames={{
							popoverContent: "w-fit",
							value: "mr-6",
							label: "mr-6",
						}}
						className="[&_*]:overflow-visible"
					>
						{Object.entries(event.volunteers).map(
							([volunteer, availability]) => (
								<SelectItem
									key={volunteer}
									color={availability2Color(availability)}
									className={[
										"text-" + availability2Color(availability),
										availability2Tailwind(availability),
									].join(" ")}
								>
									{volunteer}
								</SelectItem>
							),
						)}
					</Select>
				);
		}
	}

	const [showAddEvent, setShowAddEvent] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [activeEvent, setActiveEvent] = useState(zustand.getState().events[0]);

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
				sortDescriptor={list.sortDescriptor}
				onSortChange={list.sort}
				classNames={{
					wrapper: "bg-accent-4",
					tr: "even:bg-accent-5 ",
					th: "font-subheadline text-xl text-accent-1 bg-transparent ",
					thead: "[&>tr]:first:!shadow-border",
				}}
				className="w-fit"
			>
				<TableHeader columns={tasks}>
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
				<TableBody items={list.items} emptyContent={"No events scheduled"}>
					{(event) => (
						<TableRow key={event.id}>
							{(columnKey) => (
								<TableCell>{getKeyValue(event, columnKey)}</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddEvent isOpen={showAddEvent} onOpenChange={setShowAddEvent} />

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
						<Button startContent={<TrashCan />} color="danger">
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
		</div>
	);
}
