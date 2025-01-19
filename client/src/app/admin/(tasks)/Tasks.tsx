import { apiCall, Task } from "@/lib";
import { AddLarge, Edit } from "@carbon/icons-react";
import {
	Button,
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

export default function Tasks() {
	const [showAddTask, setShowAddTask] = useState(false);
	const [editTask, setEditTask] = useState<Task>();

	const tasks = useAsyncList<Task>({
		async load() {
			const result = await apiCall("GET", "tasks");

			if (result.ok) {
				const json = await result.json();

				return {
					items: json.tasks,
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
							cmp = a.text.localeCompare(b.text);
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

	const topContent = (
		<>
			<Button
				color="primary"
				startContent={<AddLarge />}
				onPress={() => setShowAddTask(true)}
			>
				Add Task
			</Button>
		</>
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
			>
				<TableHeader>
					<TableColumn allowsSorting key="userName">
						Text
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
						<TableRow key={task.id}>
							<TableCell>{task.text}</TableCell>
							<TableCell>
								<Checkbox isSelected={task.enabled} />
							</TableCell>
							<TableCell>
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
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddTask
				isOpen={showAddTask}
				onOpenChange={setShowAddTask}
				onSuccess={tasks.reload}
			/>

			<EditTask
				value={editTask}
				isOpen={!!editTask}
				onOpenChange={(isOpen) => (!isOpen ? setEditTask(undefined) : null)}
				onSuccess={tasks.reload}
			/>
		</div>
	);
}
