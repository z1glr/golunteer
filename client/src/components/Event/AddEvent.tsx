import { Button } from "@heroui/react";
import { apiCall } from "@/lib";
import { AddLarge } from "@carbon/icons-react";
import EventEditor, { EventSubmitData } from "./EventEditor";
import { useState } from "react";

export default function AddEvent(props: {
	className?: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	const [addEventKey, setAddEventKey] = useState<number>(0);

	async function addEvent(data: EventSubmitData) {
		const result = await apiCall("POST", "events", undefined, data);

		if (result.ok) {
			props.onOpenChange(false);

			setAddEventKey(addEventKey + 1);

			props.onSuccess?.();
		}
	}

	return (
		<EventEditor
			key={addEventKey}
			{...props}
			header="Add Event"
			onSubmit={(data) => void addEvent(data)}
			footer={
				<Button
					color="primary"
					radius="full"
					startContent={<AddLarge />}
					type="submit"
				>
					Add
				</Button>
			}
		/>
	);
}
