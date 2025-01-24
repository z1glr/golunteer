"use client";

import AvailabilitySelector from "@/components/Event/AvailabilitySelector";
import Event from "@/components/Event/Event";
import { apiCall } from "@/lib";
import { EventAvailability } from "@/Zustand";
import { useAsyncList } from "@react-stately/data";

export default function PendingEvents() {
	// get the events the user hasn't yet inserted his availability for
	const events = useAsyncList({
		async load() {
			const result = await apiCall<EventAvailability[]>(
				"GET",
				"events/user/pending",
			);

			if (result.ok) {
				return {
					items: await result.json(),
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
					<AvailabilitySelector event={e} className="mt-auto" />
				</Event>
			))}
		</div>
	);
}
