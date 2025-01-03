"use client";

import { AddLarge, CloseLarge } from "@carbon/icons-react";
import Event, { EventData } from "./Event/Event";
import { useState } from "react";
import AddEvent from "./Event/AddEvent";
import Button from "./Button";

export default function EventVolunteer() {
	const events: EventData[] = [
		{
			id: 0,
			date: new Date("2025-01-05"),
			tasks: {
				"0": "Mark",
			},
			description: "neuer Prädikant",
		},
		{
			id: 1,
			date: new Date("2025-01-12"),
			tasks: {
				"0": "Mark",
				"1": undefined,
			},
			description: "",
		},
	];

	const [showAddItemDialogue, setShowAddItemDialogue] = useState(true);

	return (
		<div className="relative flex-1 p-4">
			<h2 className="mb-4 text-center text-4xl">Overview</h2>
			<div className="flex flex-wrap justify-center gap-4">
				{events.map((ee) => Event(ee))}
			</div>

			<Button
				className="absolute bottom-0 right-0 aspect-square"
				onClick={() => setShowAddItemDialogue(true)}
			>
				<AddLarge size={32} />
			</Button>

			{showAddItemDialogue ? (
				<div
					className="absolute inset-0 flex flex-col items-center backdrop-blur"
					onClick={(e) => {
						if (e.target === e.currentTarget) {
							setShowAddItemDialogue(false);
							e.preventDefault();
						}
					}}
				>
					<div className="relative">
						<AddEvent className="border-2 border-accent-3" />
						<Button
							className="absolute right-2 top-2 aspect-square"
							onClick={() => setShowAddItemDialogue(false)}
						>
							<CloseLarge />
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
