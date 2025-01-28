import {
	AllString,
	classNames,
	getTasks,
	validatePassword as validatePassword,
} from "@/lib";
import zustand, { User, UserAddModify } from "@/Zustand";
import {
	Checkbox,
	CheckboxGroup,
	Form,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import React, { FormEvent, useState } from "react";

export default function UserEditor(props: {
	header: React.ReactNode;
	footer: React.ReactNode;
	value?: User;
	isPasswordRequired?: boolean;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSubmit: (user: UserAddModify) => void;
}) {
	const [name, setName] = useState(props.value?.userName ?? "");
	const [password, setPassword] = useState("");
	const [admin, setAdmin] = useState(props.value?.admin ?? false);
	const [possibleTasks, setPossibleTasks] = useState<string[]>(
		props.value?.possibleTasks.map((t) => t.toString()) ?? [],
	);

	const tasks = useAsyncList({
		async load() {
			return {
				items: await getTasks(),
			};
		},
	});

	const pwErrors = validatePassword(password);

	// update the user in the backend
	async function submit(e: FormEvent<HTMLFormElement>) {
		const formData = Object.fromEntries(
			new FormData(e.currentTarget),
		) as AllString<UserAddModify>;

		const data = {
			...formData,
			possibleTasks: possibleTasks.map((t) => parseInt(t)),
			admin: formData.admin !== undefined,
		};

		// if we modify ourself, set admin to true since it isn't included in the form data because the checkbox is disabled
		data.admin ||= props.value?.userName === zustand.getState().user?.userName;

		props.onSubmit(data);
	}

	return (
		<Modal
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			shadow={"none"}
			backdrop="blur"
			classNames={{
				base: "bg-accent-5",
			}}
		>
			<Form
				validationBehavior="native"
				onSubmit={(e) => {
					e.preventDefault();
					submit(e);
				}}
			>
				<ModalContent>
					<ModalHeader>
						<h1 className="text-2xl">{props.header}</h1>
					</ModalHeader>
					<ModalBody className="w-full">
						<Input
							isRequired
							label="Name"
							color={
								!!props.value && name !== props.value?.userName
									? "warning"
									: "default"
							}
							name="userName"
							variant="bordered"
							value={name}
							onValueChange={setName}
						/>
						<Input
							isRequired={props.isPasswordRequired}
							label="Password"
							color={password.length > 0 ? "warning" : "default"}
							name="password"
							variant="bordered"
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
							color={
								!!props.value && admin !== props.value?.admin
									? "warning"
									: "primary"
							}
							isDisabled={
								props.value?.userName === zustand.getState().user?.userName
							}
							isSelected={admin}
							onValueChange={setAdmin}
							classNames={{
								label: classNames({
									"text-warning": !!props.value && admin !== props.value?.admin,
								}),
							}}
						>
							Admin
						</Checkbox>
						<CheckboxGroup
							label="Assignable Tasks"
							value={possibleTasks}
							onValueChange={setPossibleTasks}
						>
							{tasks.items.map((task) => (
								<Checkbox key={task.taskID} value={task.taskID?.toString()}>
									{task.taskName}
								</Checkbox>
							))}
						</CheckboxGroup>
					</ModalBody>
					<ModalFooter>{props.footer}</ModalFooter>
				</ModalContent>
			</Form>
		</Modal>
	);
}
