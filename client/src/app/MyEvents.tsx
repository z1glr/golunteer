"use client";

import AssignmentTable from "@/components/Event/AssignmentTable";
import Event from "@/components/Event/Event";
import { apiCall } from "@/lib";
import zustand, { EventData } from "@/Zustand";
import { useAsyncList } from "@react-stately/data";

export default function MyEvents() {
	const user = zustand((state) => state.user);

	const events = useAsyncList({
		async load() {
			const result = await apiCall<EventData[]>("GET", "events/user/assigned");

			if (result.ok) {
				const data = await result.json();

				return {
					items: data,
				};
			} else {
				return {
					items: [],
				};
			}
		},
	});

	return (
		<div className="flex justify-center gap-4">
			{events.items.map((e) => (
				<Event key={e.eventID} event={e}>
					<AssignmentTable
						className="mt-auto"
						tasks={e.tasks}
						highlightUser={user?.userName}
					/>
				</Event>
			))}
		</div>
	);
}
