import { useAsyncList } from "@react-stately/data";
import AvailabilityChip from "../AvailabilityChip";
import { EventAvailabilities } from "@/Zustand";
import { getAvailabilities } from "@/lib";
import { Fragment } from "react";

export default function AvailabilityTable({
	className,
	availabilities: eventAvailabilities,
}: {
	className?: string;
	availabilities: EventAvailabilities["availabilities"];
}) {
	const availabilities = useAsyncList({
		async load() {
			return {
				items: await getAvailabilities(),
			};
		},
	});

	return (
		<div className={className}>
			<h4>Availabilities</h4>
			<div className="grid grid-cols-[auto_1fr] items-center gap-2">
				{Object.entries(eventAvailabilities).map(([a, users]) => (
					<Fragment key={a}>
						<AvailabilityChip className="mx-auto">
							{availabilities.items.find(
								(i) => i.availabilityID === parseInt(a),
							)}
						</AvailabilityChip>
						<div className="text-sm italic">{users.join(", ")}</div>
					</Fragment>
				))}
			</div>
		</div>
	);
}
