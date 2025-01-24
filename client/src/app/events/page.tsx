"use client";
import AddEvent from "@/components/Event/AddEvent";
import AssignmentTable from "@/components/Event/AssignmentTable";
import Event from "@/components/Event/Event";
import { apiCall } from "@/lib";
import zustand, { EventDataWithAvailability } from "@/Zustand";
import { Add } from "@carbon/icons-react";
import { Button, Tab, Tabs } from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import { useState } from "react";
import AvailabilitySelector from "@/components/Event/AvailabilitySelector";

export default function Events() {
	const [showAddItemDialogue, setShowAddItemDialogue] = useState(false);
	const [filter, setFilter] = useState<string | number>("");

	const user = zustand((state) => state.user);

	const events = useAsyncList({
		async load() {
			const result = await apiCall<EventDataWithAvailability[]>(
				"GET",
				"events/user/assignmentAvailability",
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

	function showEvent(event: EventDataWithAvailability): boolean {
		switch (filter) {
			case "assigned":
				return event.tasks.some((t) => {
					return t.userName === user?.userName;
				});

			case "pending":
				return event.availability === null;

			default:
				return true;
		}
	}

	return (
		<div className="relative flex flex-1 flex-col gap-4">
			<h2 className="text-center text-4xl">Upcoming Events</h2>

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

			<div className="flex flex-wrap justify-center gap-4">
				{events.items.filter(showEvent).map((e) => (
					<Event key={e.eventID} event={e}>
						<AssignmentTable
							highlightUser={user?.userName}
							tasks={e.tasks}
							className="mt-auto"
						/>
						<AvailabilitySelector event={e} startSelection={e.availability} />
					</Event>
				))}
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
