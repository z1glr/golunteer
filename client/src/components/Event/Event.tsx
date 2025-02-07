"use client";

import LocalDate from "../LocalDate";
import { BaseEvent } from "@/Zustand";
import { Card, CardBody, CardFooter, CardHeader, Divider } from "@heroui/react";
import React from "react";

export default function Event({
	event,
	children,
}: {
	event: BaseEvent;
	children?: React.ReactNode | [React.ReactNode, React.ReactNode];
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
				{event.description != "" ? (
					<div>
						<h4>Description</h4>
						<div className="ms-2 mt-2">{event.description}</div>
					</div>
				) : null}

				{Array.isArray(children) ? children[0] : children}
			</CardBody>
			{Array.isArray(children) && !!children[1] ? (
				<>
					<Divider />
					<CardFooter>{children[1]}</CardFooter>
				</>
			) : null}
		</Card>
	);
}
