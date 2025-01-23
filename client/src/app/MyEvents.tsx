"use client";

import { apiCall } from "@/lib";
import { EventData } from "@/Zustand";
import { useAsyncList } from "@react-stately/data";

export default function MyEvents() {
	const events = useAsyncList({
		async load() {
			const result = await apiCall<EventData[]>("GET", "events/user/assigned");

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
			<h2>{events.items.map((e) => e.date)}</h2>
		</div>
	);
}
