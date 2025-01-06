import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import LocalDate from "./LocalDate";
import { EventData } from "@/Zustand";

export default function Event(props: EventData) {
	return (
		<Card
			classNames={{
				base: "bg-accent-4 w-64",
				body: "flex flex-col gap-4",
			}}
			shadow="none"
		>
			<CardHeader>
				<h3 className="bold mb-1 text-2xl">
					<LocalDate
						options={{
							dateStyle: "short",
							timeStyle: "short",
							timeZone: "Europe/Berlin", // TODO: check with actual backend
						}}
					>
						{props.date.toDate()}
					</LocalDate>
				</h3>
			</CardHeader>
			<Divider />
			<CardBody>
				<div>{props.description}</div>

				<table>
					<caption>
						<h4>Task assignment</h4>
					</caption>
					<tbody>
						{Object.entries(props.tasks).map(([task, person], ii) => (
							<tr key={ii}>
								<th className="pr-4 text-left">{task}</th>
								<td>
									{person ?? <span className="text-highlight">missing</span>}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardBody>
		</Card>
	);
}
