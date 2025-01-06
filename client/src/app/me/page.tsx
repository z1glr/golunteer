import Event from "@/components/Event/Event";
import zustand, { Availabilities, Availability } from "@/Zustand";
import { Radio, RadioGroup } from "@nextui-org/radio";

function availability2Color(availability: Availability) {
	switch (availability) {
		case "yes":
			return "success";
		case "maybe":
			return "warning";
		default:
			return "danger";
	}
}

export default function OverviewPersonal() {
	return (
		<div>
			<h2 className="mb-4 text-center text-4xl">Upcoming Events</h2>
			<div className="flex flex-wrap justify-center gap-4">
				{zustand.getState().events.map((ev) => (
					<Event key={ev.id} event={ev}>
						<RadioGroup className="mt-auto" orientation="horizontal">
							{Availabilities.map((availability) => (
								<Radio
									value={availability}
									key={availability}
									color={availability2Color(availability)}
									classNames={{
										label: `text-${availability2Color(availability)}`,
									}}
								>
									{availability}
								</Radio>
							))}
						</RadioGroup>
					</Event>
				))}
			</div>
		</div>
	);
}
