"use client";

import { apiCall } from "@/lib";
import { EventData } from "@/Zustand";
import { useAsyncList } from "@react-stately/data";

export default function MyEvents() {
	const events = useAsyncList({
		async load() {
			const result = await apiCall<EventData[]>("GET", "events/user/assigned");

			if (result.ok) {
				const data = await result.json();

				console.debug(data);

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
			<h2>{events.items.map((e) => e.date)}</h2>
		</div>
	);
}
