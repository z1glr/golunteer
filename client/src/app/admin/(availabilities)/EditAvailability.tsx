import { apiCall } from "@/lib";
import AvailabilityEditor, { Availability } from "./AvailabilityEditor";
import { Button } from "@heroui/react";
import { Renew } from "@carbon/icons-react";
import AvailabilityChip from "@/components/AvailabilityChip";

export default function EditAvailability(props: {
	value: Availability | undefined;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	async function updateAvailability(a: Availability) {
		const result = await apiCall("PATCH", "availabilities", undefined, a);

		if (result.ok) {
			props.onSuccess?.();
			props.onOpenChange?.(false);
		}
	}

	return (
		<AvailabilityEditor
			key={props.value?.id}
			header={
				<>
					Edit Availability{" "}
					{!!props.value ? (
						<AvailabilityChip availability={props.value} className="ms-4" />
					) : null}
				</>
			}
			footer={
				<Button type="submit" color="primary" startContent={<Renew />}>
					Update
				</Button>
			}
			value={props.value}
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			onSubmit={updateAvailability}
		/>
	);
}
