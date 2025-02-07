import { apiCall, Task } from "@/lib";
import TaskEditor from "./TaskEditor";
import { Button } from "@heroui/react";
import { AddLarge } from "@carbon/icons-react";
import { useState } from "react";

export default function AddTask(props: {
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	const [addTaskKey, setAddTaskKey] = useState<number>(0);

	async function addTask(a: Task) {
		const result = await apiCall("POST", "tasks", undefined, a);

		if (result.ok) {
			props.onOpenChange?.(false);

			setAddTaskKey(addTaskKey);

			props.onSuccess?.();
		}
	}

	return (
		<TaskEditor
			key={addTaskKey}
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
