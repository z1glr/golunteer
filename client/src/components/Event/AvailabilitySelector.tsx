import { Select, Selection, SelectItem } from "@heroui/react";
import AvailabilityChip from "../AvailabilityChip";
import { apiCall, getAvailabilities } from "@/lib";
import { useAsyncList } from "@react-stately/data";
import { EventAvailability } from "@/Zustand";
import { useState } from "react";

export default function AvailabilitySelector({
	event,
	className,
	startSelection,
}: {
	event: EventAvailability;
	className?: string;
	startSelection?: number;
}) {
	const [value, setValue] = useState<Selection>(new Set([]));

	// the individual, selectable availabilities
	const availabilities = useAsyncList({
		async load() {
			const availabilities = (await getAvailabilities()).filter(
				(a) => a.enabled,
			);

			// if the availabilities contain the startSelection, set it
			if (
				!!startSelection &&
				availabilities.some((a) => a.availabilityID === startSelection)
			) {
				setValue(new Set([startSelection.toString()]));
			}

			return {
				items: availabilities,
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
		<Select
			items={availabilities.items}
			label="Availability"
			variant="bordered"
			className={className}
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
			selectedKeys={value}
			onSelectionChange={(a) => {
				void setAvailability(event.eventID, parseInt(a.anchorKey ?? ""));
				setValue(a);
			}}
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
	);
}
