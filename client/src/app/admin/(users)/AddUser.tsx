import { apiCall } from "@/lib";
import { AddLarge } from "@carbon/icons-react";
import { Button } from "@heroui/react";
import UserEditor from "./UserEditor";
import { UserAddModify } from "@/Zustand";
import { useState } from "react";

export default function AddUser(props: {
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	const [addUserKey, setAddUserKey] = useState<number>(0);

	// send an addUser request to the backend then reload the table
	async function sendAddUser(user: UserAddModify) {
		const result = await apiCall("POST", "users", undefined, user);

		if (result.ok) {
			setAddUserKey(addUserKey + 1);
			props.onSuccess?.();
		}
	}

	return (
		<UserEditor
			key={addUserKey}
			isPasswordRequired
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			header="Add User"
			footer={
				<Button type="submit" color="primary" startContent={<AddLarge />}>
					Add User
				</Button>
			}
			onSubmit={sendAddUser}
		/>
	);
}
