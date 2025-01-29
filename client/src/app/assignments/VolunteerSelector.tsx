import AvailabilityChip from "@/components/AvailabilityChip";
import { TaskAssignment } from "@/Zustand";
import { AddLarge } from "@carbon/icons-react";
import {
	Button,
	Chip,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
} from "@heroui/react";
import { EventWithAvailabilities } from "./page";
import { ReactElement, useEffect, useState } from "react";
import { Availability } from "../admin/(availabilities)/AvailabilityEditor";
import { apiCall, classNames, getUsers } from "@/lib";
import { useAsyncList } from "@react-stately/data";

export default function VolunteerSelector({
	event,
	task,
	getAvailabilityById,
	onReloadRequest,
}: {
	event: EventWithAvailabilities;
	task: TaskAssignment;
	getAvailabilityById: (availabilityID: number) => Availability;
	onReloadRequest: () => void;
}) {
	const [selectableUsers, setSelectableUsers] = useState<[string, string[]][]>(
		[],
	);

	const users = useAsyncList({
		async load() {
			return {
				items: await getUsers(),
			};
		},
	});

	useEffect(() => {
		// create a set with all the users that can be assigned to this task
		const validUsers = new Set(
			users.items
				.filter((user) => user.possibleTasks.includes(task.taskID))
				.map((user) => user.userName),
		);

		setSelectableUsers(
			Object.entries(event.availabilities)
				.map(
					([availabilityID, availabilityUsers]):
						| [string, string[]]
						| undefined => {
						const thisUsers = availabilityUsers.filter((userName) =>
							validUsers.has(userName),
						);

						// if there is at least one user over, return it
						if (thisUsers.length > 0) {
							return [availabilityID, thisUsers];
						}
					},
				)
				.filter((i) => !!i),
		);
	}, [event.availabilities, users.items, task.taskID]);

	async function sendVolunteerAssignment(
		eventID: number,
		taskID: number,
		userName: string,
	) {
		const result = await apiCall(
			"PUT",
			"events/assignments",
			{ eventID, taskID },
			userName,
		);

		if (result.ok) {
			onReloadRequest();
		}
	}

	// sends a command to the backend to remove an volunteer-assignment
	async function removeVolunteerAssignment(eventID: number, taskID: number) {
		const result = await apiCall("DELETE", "events/assignments", {
			eventID,
			taskID,
		});

		if (result.ok) {
			onReloadRequest();
		}
	}

	return (
		<Dropdown>
			<DropdownTrigger>
				{!!event.tasks.find((t) => t.taskID == task.taskID)?.userName ? (
					<Chip
						onClose={() =>
							removeVolunteerAssignment(event.eventID, task.taskID)
						}
					>
						{event.tasks.find((t) => t.taskID == task.taskID)?.userName}
					</Chip>
				) : (
					<Button isIconOnly size="sm" radius="md" variant="flat">
						<AddLarge className="mx-auto" />
					</Button>
				)}
			</DropdownTrigger>
			<DropdownMenu
				onAction={(a) =>
					sendVolunteerAssignment(event.eventID, task.taskID, a as string)
				}
			>
				{selectableUsers.map(
					([availabilityId, volunteers], iAvailability, aAvailabilities) => (
						<DropdownSection
							key={availabilityId}
							showDivider={iAvailability < aAvailabilities.length - 1}
							classNames={{
								base: "flex flex-col justify-start",
								heading: "mx-auto",
							}}
							title={
								(
									<AvailabilityChip
										availability={getAvailabilityById(parseInt(availabilityId))}
									/>
								) as ReactElement & string
							}
						>
							{volunteers.map((v) => (
								<DropdownItem
									key={v}
									classNames={{
										base: "", // this empty class is needed, else some styles are applied
										title: classNames({
											"text-primary font-bold": v === task.userName,
										}),
									}}
								>
									{v}
								</DropdownItem>
							))}
						</DropdownSection>
					),
				)}
			</DropdownMenu>
		</Dropdown>
	);
}
