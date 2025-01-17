import { Button } from "@heroui/react";
import EditEvent, { EventSubmitData } from "./EditEvent";
import { apiCall } from "@/lib";
import { AddLarge } from "@carbon/icons-react";

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
		<EditEvent
			{...props}
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
		>
			Add Event
		</EditEvent>
	);
}
