import { apiCall, Task } from "@/lib";
import { AddLarge, Edit, TrashCan } from "@carbon/icons-react";
import {
	Button,
	ButtonGroup,
	Checkbox,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import { useState } from "react";
import AddTask from "./AddTask";
import EditTask from "./EditTask";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import zustand from "@/Zustand";

export default function Tasks() {
	const [showAddTask, setShowAddTask] = useState(false);
	const [editTask, setEditTask] = useState<Task>();
	const [deleteTask, setDeleteTask] = useState<Task>();

	const tasks = useAsyncList<Task>({
		async load() {
			const result = await apiCall("GET", "tasks");

			if (result.ok) {
				const json = (await result.json()) as Task[];

				return {
					items: json,
				};
			} else {
				return {
					items: [],
				};
			}
		},
		async sort({ items, sortDescriptor }) {
			return {
				items: items.sort((a, b) => {
					let cmp = 0;

					switch (sortDescriptor.column) {
						case "text":
							cmp = a.taskName.localeCompare(b.taskName);
							break;
						case "enabled":
							if (a.enabled && !b.enabled) {
								cmp = -1;
							} else if (!a.enabled && b.enabled) {
								cmp = 1;
							}
							break;
					}

					if (sortDescriptor.direction === "descending") {
						cmp *= -1;
					}

					return cmp;
				}),
			};
		},
	});

	function reload() {
		// clear the zustand
		zustand.getState().patch({ tasks: undefined });

		// reload the tasks
		tasks.reload();
	}

	async function sendDeleteTask(taskID: number | undefined) {
		if (taskID !== undefined) {
			const result = await apiCall("DELETE", "tasks", { taskID });

			if (result.ok) {
				tasks.reload();
				setDeleteTask(undefined);
			}
		}
	}

	const topContent = (
		<div>
			<Button
				color="primary"
				startContent={<AddLarge />}
				onPress={() => setShowAddTask(true)}
			>
				Add Task
			</Button>
		</div>
	);

	return (
		<div>
			<Table
				aria-label="Table with the tasks"
				shadow="none"
				isStriped
				isHeaderSticky
				topContent={topContent}
				sortDescriptor={tasks.sortDescriptor}
				onSortChange={tasks.sort}
				topContentPlacement="outside"
				classNames={{
					wrapper: "bg-accent-4",
					tr: "even:bg-accent-5 ",
					th: "font-subheadline text-xl text-accent-1 bg-transparent ",
					thead: "[&>tr]:first:!shadow-border",
				}}
			>
				<TableHeader>
					<TableColumn allowsSorting key="userName">
						Name
					</TableColumn>
					<TableColumn allowsSorting key="admin" align="center">
						Enabled
					</TableColumn>
					<TableColumn key="edit" align="center">
						Edit
					</TableColumn>
				</TableHeader>
				<TableBody items={tasks.items}>
					{(task) => (
						<TableRow key={task.taskID}>
							<TableCell>{task.taskName}</TableCell>
							<TableCell>
								<Checkbox isSelected={task.enabled} />
							</TableCell>
							<TableCell>
								<ButtonGroup>
									<Button
										isIconOnly
										variant="light"
										size="sm"
										onPress={() => setEditTask(task)}
									>
										<Tooltip content="Edit task">
											<Edit />
										</Tooltip>
									</Button>
									<Button
										isIconOnly
										variant="light"
										size="sm"
										onPress={() => setDeleteTask(task)}
										color="danger"
										className="text-danger"
									>
										<TrashCan />
									</Button>
								</ButtonGroup>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddTask
				isOpen={showAddTask}
				onOpenChange={setShowAddTask}
				onSuccess={reload}
			/>

			<EditTask
				value={editTask}
				isOpen={!!editTask}
				onOpenChange={(isOpen) => (!isOpen ? setEditTask(undefined) : null)}
				onSuccess={reload}
			/>

			<DeleteConfirmation
				isOpen={!!deleteTask}
				onOpenChange={(isOpen) => (!isOpen ? setDeleteTask(undefined) : null)}
				itemName="Task"
				onDelete={() => sendDeleteTask(deleteTask?.taskID)}
			>
				{!!deleteTask ? (
					<>
						The task{" "}
						<span className="font-numbers text-accent-1">
							{deleteTask.taskName}
						</span>{" "}
						will be deleted.
					</>
				) : null}
			</DeleteConfirmation>
		</div>
	);
}
