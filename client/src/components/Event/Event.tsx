"use client";

import LocalDate from "../LocalDate";
import { EventData } from "@/Zustand";
import { Card, CardBody, CardHeader, Divider } from "@nextui-org/react";
import React from "react";

export default function Event({
	event,
	children,
}: {
	event: EventData;
	children?: React.ReactNode;
}) {
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
						}}
					>
						{event.date}
					</LocalDate>
				</h3>
			</CardHeader>
			<Divider />
			<CardBody>
				<div>{event.description}</div>

				{children}
			</CardBody>
		</Card>
	);
}
