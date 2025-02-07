import { apiCall } from "@/lib";
import AvailabilityEditor, { Availability } from "./AvailabilityEditor";
import { Button } from "@heroui/react";
import { AddLarge } from "@carbon/icons-react";
import { useState } from "react";

export default function AddAvailability(props: {
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	const [addAvailabilityKey, setAddAvailabilityKey] = useState<number>(0);

	async function addAvailability(a: Availability) {
		const result = await apiCall("POST", "availabilities", undefined, a);

		if (result.ok) {
			props.onOpenChange?.(false);

			setAddAvailabilityKey(addAvailabilityKey + 1);

			props.onSuccess?.();
		}
	}

	return (
		<AvailabilityEditor
			key={addAvailabilityKey}
			header="Add Availability"
			footer={
				<Button type="submit" color="primary" startContent={<AddLarge />}>
					Add
				</Button>
			}
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			onSubmit={addAvailability}
		/>
	);
}
