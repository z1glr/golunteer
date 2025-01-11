import { apiCall } from "@/lib";
import { User } from "@/Zustand";
import {
	Button,
	Checkbox,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";
import { FormEvent, useState } from "react";
import AddUser from "./AddUser";

export default function Users() {
	const [showAddUser, setShowAddUser] = useState(false);
	const users = useAsyncList<User>({
		async load() {
			return {
				items: [
					{ userName: "admin", admin: true },
					{ userName: "foo", admin: false },
					{ userName: "bar", admin: true },
				],
			};
		},
		async sort({ items, sortDescriptor }) {
			return {
				items: items.sort((a, b) => {
					let cmp = 0;

					switch (sortDescriptor.column) {
						case "admin":
							if (a.admin && !b.admin) {
								cmp = -1;
							} else if (!a.admin && b.admin) {
								cmp = 1;
							}
							break;
						case "userName":
							cmp = a.userName.localeCompare(b.userName);
					}

					if (sortDescriptor.direction === "descending") {
						cmp *= -1;
					}

					return cmp;
				}),
			};
		},
	});

	// send an addUser request to the backend then reload the table
	async function addUser(e: FormEvent<HTMLFormElement>) {
		const data = Object.fromEntries(new FormData(e.currentTarget));

		const result = await apiCall("POST", "users", undefined, {
			...data,
			admin: data.admin === "admin",
		});

		if (result.ok) {
			users.reload();
		}
	}

	const topContent = (
		<>
			<Button onPress={() => setShowAddUser(true)}>Add User</Button>
		</>
	);

	return (
		<div>
			<Table
				aria-label="Table with all users"
				shadow="none"
				isHeaderSticky
				topContent={topContent}
				sortDescriptor={users.sortDescriptor}
				onSortChange={users.sort}
			>
				<TableHeader>
					<TableColumn allowsSorting key="userName">
						Username
					</TableColumn>
					<TableColumn allowsSorting key="admin">
						Admin
					</TableColumn>
				</TableHeader>
				<TableBody items={users.items}>
					{(user) => (
						<TableRow key={user.userName}>
							<TableCell>{user.userName}</TableCell>
							<TableCell>
								<Checkbox isSelected={user.admin} />
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddUser
				isOpen={showAddUser}
				onOpenChange={setShowAddUser}
				onSubmit={(e) => void addUser(e)}
			/>
		</div>
	);
}
