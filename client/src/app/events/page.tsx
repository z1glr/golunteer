"use client";
import AddEvent from "@/components/Event/AddEvent";
import AssignmentTable from "@/components/Event/AssignmentTable";
import Event from "@/components/Event/Event";
import { apiCall } from "@/lib";
import zustand, { EventData } from "@/Zustand";
import { Add } from "@carbon/icons-react";
import { Button } from "@nextui-org/react";
import { useEffect, useState } from "react";

export default function Events() {
	const [showAddItemDialogue, setShowAddItemDialogue] = useState(false);
	const events = zustand((state) => state.events);
	const admin = zustand((state) => state.user?.admin);

	useEffect(() => {
		(async () => {
			const data = await apiCall<EventData[]>("GET", "events/assignments");

			if (data.ok) {
				zustand.getState().setEvents(await data.json());
			}

			return {
				items: [],
			};
		})();
	}, []);

	return (
		<div className="relative flex-1">
			<h2 className="mb-4 text-center text-4xl">Upcoming Events</h2>
			<div className="flex flex-wrap justify-center gap-4">
				{events.map((ee, ii) => (
					<Event key={ii} event={ee}>
						<div className="mt-auto">
							<AssignmentTable tasks={ee.tasks} />
						</div>
					</Event>
				))}
			</div>

			{admin ? (
				<>
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
				</>
			) : null}
		</div>
	);
}
