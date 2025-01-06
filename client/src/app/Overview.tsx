"use client";

import { Add } from "@carbon/icons-react";
import Event from "../components/Event/Event";
import { useState } from "react";
import AddEvent from "../components/Event/AddEvent";
import zustand from "../Zustand";
import { Button } from "@nextui-org/button";

export default function EventVolunteer() {
	const [showAddItemDialogue, setShowAddItemDialogue] = useState(false);

	return (
		<div className="relative flex-1 p-4">
			<h2 className="mb-4 text-center text-4xl">Overview</h2>
			<div className="flex flex-wrap justify-center gap-4">
				{zustand.getState().events.map((ee, ii) => (
					<Event
						key={ii}
						date={ee.date}
						description={ee.description}
						id={ee.id}
						tasks={ee.tasks}
						volunteers={ee.volunteers}
					/>
				))}
			</div>

			<Button
				color="primary"
				isIconOnly
				radius="full"
				className="absolute bottom-0 right-0"
				onPress={() => setShowAddItemDialogue(true)}
			>
				<Add size={32} />
			</Button>

			<AddEvent
				className="border-2 border-accent-3"
				isOpen={showAddItemDialogue}
				onOpenChange={setShowAddItemDialogue}
			/>
		</div>
	);
}
