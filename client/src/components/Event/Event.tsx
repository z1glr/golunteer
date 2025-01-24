"use client";

import LocalDate from "../LocalDate";
import { BaseEvent } from "@/Zustand";
import { Card, CardBody, CardHeader, Divider, Textarea } from "@heroui/react";
import React from "react";

export default function Event({
	event,
	children,
}: {
	event: BaseEvent;
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
				<Textarea
					isReadOnly
					label="Description"
					defaultValue={event.description}
					variant="bordered"
				/>

				{children}
			</CardBody>
		</Card>
	);
}
