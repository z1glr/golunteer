import {
	apiCall,
	classNames,
	vaidatePassword as validatePassword,
} from "@/lib";
import zustand, { User } from "@/Zustand";
import {
	Button,
	Checkbox,
	Form,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@nextui-org/react";
import { FormEvent, useEffect, useState } from "react";

export default function EditUser(props: {
	isOpen: boolean;
	user?: User;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess: () => void;
}) {
	const [name, setName] = useState(props.user?.userName);
	const [admin, setAdmin] = useState(props.user?.admin);
	const [password, setPassword] = useState("");

	const pwErrors = validatePassword(password);

	// set the states on value changes
	useEffect(() => {
		if (props.user !== undefined) {
			setName(props.user.userName);
			setAdmin(props.user.admin);

			// reset the password
			setPassword("");
		}
	}, [props.user]);

	// update the user in the backend
	async function updateUser(e: FormEvent<HTMLFormElement>) {
		const formData = Object.fromEntries(new FormData(e.currentTarget));

		const data = {
			...formData,
			userName: props.user?.userName,
			admin: formData.admin !== undefined,
		};

		// if we modify ourself, set admin to true since it isn't included in the form data because the checkbox is disabled
		data.admin ||= props.user?.userName === zustand.getState().user?.userName;

		const result = await apiCall("PATCH", "users", undefined, data);

		if (result.ok) {
			// if we updated ourself
			if (props.user?.userName === zustand.getState().user?.userName) {
				zustand.setState({ user: null });
			}

			props.onSuccess();
		}
	}

	return (
		<Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
			{props.user !== undefined ? (
				<ModalContent>
					<ModalHeader>
						<h1 className="text-2xl">
							Edit User{" "}
							<span className="font-numbers font-normal italic">
								{props.user.userName}
							</span>
						</h1>
					</ModalHeader>
					<Form
						validationBehavior="native"
						onSubmit={(e) => {
							e.preventDefault();
							updateUser(e);
						}}
					>
						<ModalBody className="w-full">
							<Input
								label="Name"
								color={name !== props.user.userName ? "warning" : "default"}
								name="newName"
								value={name}
								onValueChange={setName}
							/>
							<Input
								label="Password"
								color={password.length > 0 ? "warning" : "default"}
								name="password"
								value={password}
								onValueChange={setPassword}
								isInvalid={password.length > 0 && pwErrors.length > 0}
								errorMessage={
									<ul>
										{pwErrors.map((e, ii) => (
											<li key={ii}>{e}</li>
										))}
									</ul>
								}
							/>
							<Checkbox
								name="admin"
								color={admin !== props.user.admin ? "warning" : "primary"}
								isDisabled={
									props.user.userName === zustand.getState().user?.userName
								}
								isSelected={admin}
								onValueChange={setAdmin}
								classNames={{
									label: classNames({
										"text-warning": admin !== props.user.admin,
									}),
								}}
							>
								Admin
							</Checkbox>
						</ModalBody>
						<ModalFooter>
							<Button type="submit" color="primary">
								Update
							</Button>
						</ModalFooter>
					</Form>
				</ModalContent>
			) : null}
		</Modal>
	);
}
