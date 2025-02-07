"use client";

import AvailabilitySelector from "@/components/Event/AvailabilitySelector";
import Event from "@/components/Event/Event";
import Loading from "@/components/Loading";
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
		<div>
			<h1 className="mb-4 mt-8 w-full text-center text-4xl lg:mt-0">
				Pending Events
			</h1>
			{events.isLoading ? (
				<Loading />
			) : events.items.length > 0 ? (
				<div className="flex flex-wrap justify-center gap-4">
					{events.items.map((e) => (
						<Event key={e.eventID} event={e}>
							<AvailabilitySelector event={e} className="mt-auto" />
						</Event>
					))}
				</div>
			) : (
				<div className="text-center italic text-gray-400">
					No events with missing availability
				</div>
			)}
		</div>
	);
}
