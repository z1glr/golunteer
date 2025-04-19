"use client";

import LocalDate from "@/components/LocalDate";
import { apiCall, getAvailabilities, getUsers, QueryParams } from "@/lib";
import zustand, { BaseEvent } from "@/Zustand";
import { NotAvailable } from "@carbon/icons-react";
import {
	DateValue,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableColumnProps,
	TableHeader,
	TableRow,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import React, { Key, useEffect, useState } from "react";
import { Availability } from "../admin/(availabilities)/AvailabilityEditor";
import { EventWithAvailabilities } from "../assignments/page";
import AvailabilityChip from "@/components/AvailabilityChip";
import AvailabilitySelector from "@/components/Event/AvailabilitySelector";
import DateEventsSince from "@/components/DateEventsSince";
import { getLocalTimeZone, today } from "@internationalized/date";
import FilterPopover from "@/components/FilterPopover";

type EventWithUserAvailabilityMap = BaseEvent & {
	availabilities: Record<string, string>;
};

export default function Availabilities() {
	const [sinceDate, setSinceDate] = useState<DateValue | null>(
		today(getLocalTimeZone()),
	);
	const [availabilityMap, setAvailabilityMap] = useState<
		Record<number, Availability>
	>({});
	const user = zustand((state) => state.user);

	// get the users and craft them into the headers
	const headers = useAsyncList<{
		key: string | number;
		label: string;
		align?: string;
	}>({
		async load() {
			const users = await getUsers();

			const headers = {
				items: [
					{ key: "date", label: "Date" },
					{ key: "description", label: "Description" },
					{ key: user?.userName ?? "me", label: "Me", align: "center" },
					...users
						.filter((eventUser) => eventUser.userName !== user?.userName)
						.map((user) => ({
							label: user.userName,
							key: user.userName ?? -1,
							align: "center",
						})),
				],
			};

			return headers;
		},
	});

	// get the individual events
	const events = useAsyncList<EventWithUserAvailabilityMap>({
		async load() {
			let params: QueryParams | undefined = undefined;

			if (sinceDate) {
				params = {
					since: sinceDate,
				};
			}

			const result = await apiCall<EventWithAvailabilities[]>(
				"GET",
				"events/availabilities",
				params,
			);

			if (result.ok) {
				const data = await result.json();

				// convert the availabilities to a map <Users, Availability>
				const eventAvailabilities: EventWithUserAvailabilityMap[] = data.map(
					(event) => {
						const availabilities: Record<string, string> = {};
						Object.entries(event.availabilities).forEach(
							([availability, users]) => {
								users.forEach((u) => (availabilities[u] = availability));
							},
						);

						return {
							...event,
							availabilities,
						};
					},
				);

				return {
					items: eventAvailabilities,
				};
			} else {
				return { items: [] };
			}
		},
		async sort({ items, sortDescriptor }) {
			return {
				items: items.sort((a, b) => {
					let cmp = 0;

					// if it is the date-column, convert to a date
					if (sortDescriptor.column === "date") {
						const first = a[sortDescriptor.column];
						const second = b[sortDescriptor.column];

						cmp = first < second ? -1 : 1;
					}

					if (sortDescriptor.direction === "descending") {
						cmp *= -1;
					}

					return cmp;
				}),
			};
		},
	});

	// retrieve the availabilites and store them in a map
	useEffect(() => {
		(async () => {
			setAvailabilityMap(
				Object.fromEntries(
					(await getAvailabilities()).map((a) => [a.availabilityID, a]),
				),
			);
		})();
	}, []);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => void events.reload(), [sinceDate]);

	function getAvailabilityById(availabilityID: number): Availability {
		return availabilityMap[availabilityID];
	}

	function getKeyValue(
		event: EventWithUserAvailabilityMap,
		key: Key,
	): React.ReactNode {
		switch (key) {
			case "date":
				return (
					<LocalDate
						options={{ dateStyle: "medium", timeStyle: "short" }}
						className="font-bold"
					>
						{event[key]}
					</LocalDate>
				);
			case "description":
				return (
					<div className="max-w-32 whitespace-pre-wrap italic">
						{event[key]}
					</div>
				);

			case user?.userName ?? "me":
				const availability = parseInt(event.availabilities[key as string]);

				return (
					<AvailabilitySelector
						event={{
							...event,
							availability: availability,
						}}
						startSelection={availability}
						noHeader
					/>
				);

			default:
				if (event.availabilities[key as string] === undefined) {
					return <NotAvailable />;
				} else {
					return (
						<AvailabilityChip>
							{getAvailabilityById(
								parseInt(event.availabilities[key as string]),
							)}
						</AvailabilityChip>
					);
				}
		}
	}

	const topContent = (
		<div className="flex">
			<div className="ml-auto">
				<FilterPopover>
					<DateEventsSince sinceDate={sinceDate} setSinceDate={setSinceDate} />
				</FilterPopover>
			</div>
		</div>
	);

	return (
		<div className="relative flex flex-col items-center">
			<h2 className="mb-4 text-center text-4xl">Availabilities</h2>

			<Table
				aria-label="Table with all the events"
				shadow="none"
				topContent={topContent}
				topContentPlacement="outside"
				isHeaderSticky
				isStriped
				sortDescriptor={events.sortDescriptor}
				classNames={{
					wrapper: "bg-accent-4",
					tr: "even:bg-accent-5 ",
					th: "font-subheadline text-xl text-accent-1 bg-transparent ",
					thead: "[&>tr]:first:!shadow-border",
				}}
				onSortChange={events.sort}
				className="w-fit max-w-full"
			>
				<TableHeader columns={headers.items}>
					{(task) => (
						<TableColumn
							allowsSorting={task.key === "date"}
							key={task.key}
							align={task.align as TableColumnProps<string>["align"]}
						>
							{task.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody items={events.items} emptyContent={"No events scheduled"}>
					{(event) => (
						<TableRow key={event.eventID}>
							{(columnKey) => (
								<TableCell>{getKeyValue(event, columnKey)}</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
