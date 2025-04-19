"use client";
import AddEvent from "@/components/Event/AddEvent";
import AssigmentTable from "@/components/Event/AssignmentTable";
import Event from "@/components/Event/Event";
import { apiCall, getAvailabilities, getUserTasks, QueryParams } from "@/lib";
import zustand, { EventDataWithAvailabilityAvailabilities } from "@/Zustand";
import { Add } from "@carbon/icons-react";
import {
	Button,
	Checkbox,
	CheckboxGroup,
	DateValue,
	Divider,
	Tab,
	Tabs,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import { useEffect, useState } from "react";
import AvailabilitySelector from "@/components/Event/AvailabilitySelector";
import AvailabilityTable from "@/components/Event/AvailabilityTable";
import DateEventsSince from "@/components/DateEventsSince";
import { getLocalTimeZone, today } from "@internationalized/date";
import FilterPopover from "@/components/FilterPopover";

const filterValues: { text: string; value: string }[] = [
	{
		text: "Description",
		value: "description",
	},
	{
		text: "Availabilities",
		value: "availabilities",
	},
	{
		text: "Tasks",
		value: "tasks",
	},
];

export default function Events() {
	const [showAddItemDialogue, setShowAddItemDialogue] = useState(false);
	const [filter, setFilter] = useState<string | number>("all");
	const [contentFilter, setContentFilter] = useState(["description", "tasks"]);
	const [sinceDate, setSinceDate] = useState<DateValue | null>(
		today(getLocalTimeZone()),
	);

	const user = zustand((state) => state.user);

	const events = useAsyncList({
		async load() {
			let params: QueryParams | undefined = undefined;

			if (sinceDate) {
				params = {
					since: sinceDate,
				};
			}

			const result = await apiCall<EventDataWithAvailabilityAvailabilities[]>(
				"GET",
				"events/user/assignmentAvailability",
				params,
			);

			if (result.ok) {
				const data = await result.json();

				return {
					items: data,
				};
			}

			return {
				items: [],
			};
		},
	});

	const userTasks = useAsyncList({
		async load() {
			return {
				items: await getUserTasks(),
			};
		},
	});

	const availabilites = useAsyncList({
		async load() {
			return {
				items: await getAvailabilities(),
			};
		},
	});

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => void events.reload(), [sinceDate]);

	function showEvent(event: EventDataWithAvailabilityAvailabilities): boolean {
		switch (filter) {
			case "assigned":
				return event.tasks.some((t) => {
					return t.userName === user?.userName;
				});

			case "pending":
				return event.availability === null && showAvailabilitySelector(event);

			default:
				return true;
		}
	}

	function showAvailabilitySelector(
		event: EventDataWithAvailabilityAvailabilities,
	): boolean {
		return event.tasks.some((t) => userTasks.items.includes(t.taskID));
	}

	return (
		<div className="relative flex flex-1 flex-col gap-4">
			<h2 className="text-center text-4xl">Upcoming Events</h2>

			<div className="relative flex w-full">
				<Tabs
					selectedKey={filter}
					onSelectionChange={setFilter}
					color="primary"
					className="mx-auto"
				>
					<Tab key="all" title="All" />
					<Tab key="pending" title="Pending" />
					<Tab key="assigned" title="Assigned" />
				</Tabs>
				<FilterPopover className="absolute right-0">
					<CheckboxGroup value={contentFilter} onValueChange={setContentFilter}>
						{filterValues.map((f) => (
							<Checkbox key={f.value} value={f.value}>
								{f.text}
							</Checkbox>
						))}
					</CheckboxGroup>
					<Divider />
					<DateEventsSince sinceDate={sinceDate} setSinceDate={setSinceDate} />
				</FilterPopover>
			</div>

			<div className="mx-auto flex flex-wrap gap-4">
				{availabilites.items.length > 0
					? events.items.filter(showEvent).map((e) => (
							<Event
								key={e.eventID}
								event={e}
								hideDescription={!contentFilter.includes("description")}
							>
								<div className="mt-auto flex flex-col gap-4">
									{contentFilter.includes("availabilities") ? (
										<AvailabilityTable availabilities={e.availabilities} />
									) : null}
									{contentFilter.includes("tasks") ? (
										<AssigmentTable
											highlightUser={user?.userName}
											tasks={e.tasks}
										/>
									) : null}
								</div>
								{showAvailabilitySelector(e) ? (
									<AvailabilitySelector
										event={e}
										startSelection={e.availability}
									/>
								) : undefined}
							</Event>
						))
					: null}
			</div>

			{user?.admin ? (
				<>
					<Button
						color="primary"
						isIconOnly
						radius="full"
						className="absolute bottom-0 right-0"
						onPress={() => setShowAddItemDialogue(true)}
					>
						<Add size={32} />
					</Button>

					<AddEvent
						className="border-2 border-accent-3"
						isOpen={showAddItemDialogue}
						onOpenChange={setShowAddItemDialogue}
						onSuccess={events.reload}
					/>
				</>
			) : null}
		</div>
	);
}
