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
import { ReactElement } from "react";
import { Availability } from "../admin/(availabilities)/AvailabilityEditor";
import { apiCall, classNames } from "@/lib";

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
				{Object.entries(event.availabilities).map(
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
