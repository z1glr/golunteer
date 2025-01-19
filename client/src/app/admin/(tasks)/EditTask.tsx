import { apiCall, Task } from "@/lib";
import { Button } from "@heroui/react";
import { Renew } from "@carbon/icons-react";
import TaskEditor from "./TaskEditor";

export default function EditTask(props: {
	value: Task | undefined;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	async function updateTask(t: Task) {
		const result = await apiCall("PATCH", "tasks", undefined, t);

		if (result.ok) {
			props.onSuccess?.();
			props.onOpenChange?.(false);
		}
	}

	return (
		<TaskEditor
			key={props.value?.id}
			header={
				<>
					Edit Task{" "}
					<span className="font-numbers font-normal italic">
						&quot;{props.value?.text}&quot;
					</span>
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
			onSubmit={updateTask}
		/>
	);
}
