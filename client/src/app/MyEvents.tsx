"use client";

import AssignmentGrid from "@/components/Event/AssignmentTable";
import Event from "@/components/Event/Event";
import Loading from "@/components/Loading";
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
		<div>
			<h1 className="mb-4 text-center text-4xl">My Events</h1>
			{events.isLoading ? (
				<Loading />
			) : events.items.length > 0 ? (
				<div className="flex flex-wrap justify-center gap-4">
					{events.items.map((e) => (
						<Event key={e.eventID} event={e}>
							<AssignmentGrid
								className="mt-auto"
								tasks={e.tasks}
								highlightUser={user?.userName}
							/>
						</Event>
					))}
				</div>
			) : (
				<div className="text-center italic text-gray-400">
					No assigned events
				</div>
			)}
		</div>
	);
}
