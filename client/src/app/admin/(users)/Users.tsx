import { apiCall, getUsers } from "@/lib";
import zustand, { User } from "@/Zustand";
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
import AddUser from "./AddUser";
import { AddLarge, Edit, TrashCan } from "@carbon/icons-react";
import EditUser from "./EditUser";
import DeleteConfirmation from "@/components/DeleteConfirmation";

export default function Users() {
	const [showAddUser, setShowAddUser] = useState(false);
	const [editUser, setEditUser] = useState<User | undefined>();
	const [deleteUser, setDeleteUser] = useState<User | undefined>();
	const loggedInUser = zustand((state) => state.user);

	const users = useAsyncList<User>({
		async load() {
			return {
				items: await getUsers(),
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

	async function sendDeleteUser(userName: User["userName"] | undefined) {
		if (!!userName) {
			const result = await apiCall("DELETE", "users", {
				userName,
			});

			if (result.ok) {
				users.reload();
				setDeleteUser(undefined);
			}
		}
	}

	// content above the user-tabel
	const topContent = (
		<div>
			<Button
				color="primary"
				startContent={<AddLarge />}
				onPress={() => setShowAddUser(true)}
			>
				Add User
			</Button>
		</div>
	);

	return (
		<div>
			<Table
				aria-label="Table with all users"
				shadow="none"
				isHeaderSticky
				isStriped
				topContent={topContent}
				sortDescriptor={users.sortDescriptor}
				onSortChange={users.sort}
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
						Username
					</TableColumn>
					<TableColumn allowsSorting key="admin">
						Admin
					</TableColumn>
					<TableColumn key="edit">Edit</TableColumn>
				</TableHeader>
				<TableBody items={users.items}>
					{(user) => (
						<TableRow key={user.userName}>
							<TableCell>{user.userName}</TableCell>
							<TableCell>
								<Checkbox isSelected={user.admin} />
							</TableCell>
							<TableCell>
								<ButtonGroup>
									<Button
										isIconOnly
										variant="light"
										size="sm"
										onPress={() => setEditUser(user)}
										isDisabled={
											user.userName === "admin" &&
											loggedInUser?.userName !== "admin"
										}
									>
										<Tooltip content="Edit user">
											<Edit />
										</Tooltip>
									</Button>
									<Button
										isIconOnly
										variant="light"
										size="sm"
										color="danger"
										isDisabled={["admin", loggedInUser?.userName].includes(
											user.userName,
										)}
										onPress={() => setDeleteUser(user)}
									>
										<TrashCan />
									</Button>
								</ButtonGroup>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddUser
				isOpen={showAddUser}
				onOpenChange={setShowAddUser}
				onSuccess={() => {
					setShowAddUser(false);
					users.reload();
				}}
			/>
			<EditUser
				isOpen={editUser !== undefined}
				value={editUser}
				onOpenChange={(isOpen) =>
					!isOpen ? setEditUser(undefined) : undefined
				}
				onSuccess={() => {
					users.reload();
					setEditUser(undefined);
				}}
			/>

			<DeleteConfirmation
				isOpen={!!deleteUser}
				onOpenChange={(isOpen) => (!isOpen ? setDeleteUser(undefined) : null)}
				onDelete={() => sendDeleteUser(deleteUser?.userName)}
				itemName="User"
			>
				{" "}
				The user <span>{deleteUser?.userName}</span> will be deleted.
			</DeleteConfirmation>
		</div>
	);
}
