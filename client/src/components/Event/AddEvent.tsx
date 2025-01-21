import { Button } from "@heroui/react";
import { apiCall } from "@/lib";
import { AddLarge } from "@carbon/icons-react";
import EventEditor, { EventSubmitData } from "./EventEditor";

export default function AddEvent(props: {
	className?: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	async function addEvent(data: EventSubmitData) {
		const result = await apiCall("POST", "events", undefined, data);

		if (result.ok) {
			props.onOpenChange(false);

			props.onSuccess?.();
		}
	}

	return (
		<EventEditor
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
