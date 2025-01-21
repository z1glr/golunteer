import React from "react";
import { apiCall } from "@/lib";
import { EventData } from "@/Zustand";
import EventEditor, { EventSubmitData } from "./EventEditor";

export default function EditEvent(props: {
	children: React.ReactNode;
	footer: React.ReactNode;
	value?: EventData;
	className?: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	// sends the patch-event-request to the backend
	async function patchEvent(data: EventSubmitData) {
		const result = await apiCall("PATCH", "events", undefined, data);

		if (result.ok) {
			props.onSuccess?.();
		}
	}

	return (
		<EventEditor
			value={props.value}
			key={props.value?.id}
			header="Edit Event"
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			footer={props.footer}
			onSubmit={patchEvent}
		/>
	);
}
