import { apiCall } from "@/lib";
import zustand, { User, UserAddModify } from "@/Zustand";
import { Button } from "@heroui/react";
import UserEditor from "./UserEditor";
import { Renew } from "@carbon/icons-react";

export default function EditUser(props: {
	value?: User;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSuccess?: () => void;
}) {
	// update the user in the backend
	async function updateUser(user: UserAddModify) {
		const result = await apiCall("PATCH", "users", undefined, {
			...user,
			userName: props.value?.userName,
			newName: user.userName,
		});

		if (result.ok) {
			// if we updated ourself
			if (props.value?.userName === zustand.getState().user?.userName) {
				zustand.setState({ user: null });
			}

			props.onSuccess?.();
			props.onOpenChange?.(false);
		}
	}

	return (
		<UserEditor
			key={props.value?.userName}
			header={
				<>
					Edit User{" "}
					<span className="font-numbers font-normal italic">
						&quot;{props.value?.userName}&quot;
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
			onSubmit={updateUser}
		/>
	);
}
