"use client";

import AvailabilityChip from "@/components/AvailabilityChip";
import Event from "@/components/Event/Event";
import { apiCall, getAvailabilities } from "@/lib";
import { BaseEvent } from "@/Zustand";
import { Select, SelectItem } from "@heroui/react";
import { useAsyncList } from "@react-stately/data";

type EventAvailability = BaseEvent & {
	availability: number;
};

export default function PengingEvents() {
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

	// the individual, selectable availabilities
	const availabilities = useAsyncList({
		async load() {
			return {
				items: (await getAvailabilities()).filter((a) => a.enabled),
			};
		},
	});

	async function setAvailability(eventID: number, availabilityID: number) {
		await apiCall(
			"PUT",
			"events/user/availability",
			{ eventID },
			availabilityID,
		);
	}

	return (
		<div className="flex justify-center gap-4">
			{events.items.map((e) => (
				<Event key={e.eventID} event={e}>
					<Select
						items={availabilities.items}
						label="Availability"
						variant="bordered"
						className="mt-auto"
						isMultiline
						renderValue={(availability) => (
							<div>
								{availability.map((a) =>
									!!a.data ? (
										<AvailabilityChip key={a.key} availability={a.data} />
									) : null,
								)}
							</div>
						)}
						onSelectionChange={(a) =>
							setAvailability(e.eventID, parseInt(a.anchorKey ?? ""))
						}
					>
						{(availability) => (
							<SelectItem
								key={availability.availabilityID}
								textValue={availability.availabilityName}
							>
								<AvailabilityChip availability={availability} />
							</SelectItem>
						)}
					</Select>
				</Event>
			))}
		</div>
	);
}
