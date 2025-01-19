import { apiCall } from "@/lib";
import TaskEditor, { Task } from "./TaskEditor";
import { Button } from "@heroui/react";
import { AddLarge } from "@carbon/icons-react";

export default function AddTask(props: {
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	async function addTask(a: Task) {
		const result = await apiCall("POST", "tasks", undefined, a);

		if (result.ok) {
			props.onSuccess?.();
			props.onOpenChange?.(false);
		}
	}

	return (
		<TaskEditor
			header="Add Task"
			footer={
				<Button type="submit" color="primary" startContent={<AddLarge />}>
					Add
				</Button>
			}
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			onSubmit={addTask}
		/>
	);
}
