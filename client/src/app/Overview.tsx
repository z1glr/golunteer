"use client";

import { Add } from "@carbon/icons-react";
import Event from "../components/Event/Event";
import { useState } from "react";
import AddEvent from "../components/Event/AddEvent";
import zustand from "../Zustand";
import AssignmentTable from "@/components/Event/AssignmentTable";
import { useAsyncList } from "@react-stately/data";
import { apiCall } from "@/lib";
import { Button } from "@nextui-org/react";

export default function EventVolunteer() {
	const [showAddItemDialogue, setShowAddItemDialogue] = useState(false);

	// fetch the events from the server
	useAsyncList({
		load: async () => {
			const data = await apiCall("GET", "events");

			return {
				items: [],
			};
		},
	});

	return (
		<div className="relative flex-1">
			<h2 className="mb-4 text-center text-4xl">Overview</h2>
			<div className="flex flex-wrap justify-center gap-4">
				{zustand.getState().events.map((ee) => (
					<Event key={ee.id} event={ee}>
						<AssignmentTable tasks={ee.tasks} />
					</Event>
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
