import { apiCall } from "@/lib";
import AvailabilityEditor, { Availability } from "./AvailabilityEditor";
import { Button } from "@heroui/react";
import { AddLarge } from "@carbon/icons-react";

export default function AddAvailability(props: {
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	async function addAvailability(a: Availability) {
		const result = await apiCall("POST", "availabilities", undefined, a);

		if (result.ok) {
			props.onSuccess?.();
			props.onOpenChange?.(false);
		}
	}

	return (
		<AvailabilityEditor
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
