import { AllString, Task } from "@/lib";
import {
	Checkbox,
	Form,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";
import React, { FormEvent, useEffect, useState } from "react";

export default function TaskEditor(props: {
	header: React.ReactNode;
	footer: React.ReactNode;
	value?: Task;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSubmit?: (e: Task) => void;
}) {
	const [name, setName] = useState(props.value?.taskName ?? "");
	const [enabled, setEnabled] = useState(props.value?.enabled ?? true);

	// clear the inputs on closing
	useEffect(() => {
		if (!props.isOpen) {
			setName("");
			setEnabled(true);
		}
	}, [props.isOpen]);

	function submit(e: FormEvent<HTMLFormElement>) {
		const formData = Object.fromEntries(
			new FormData(e.currentTarget),
		) as AllString<Exclude<Task, "taskID">>;

		props.onSubmit?.({
			...formData,
			taskID: props.value?.taskID,
			enabled: formData.enabled == "true",
		});
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
						<h1>{props.header}</h1>
					</ModalHeader>
					<ModalBody>
						<Input
							value={name}
							onValueChange={setName}
							name="taskName"
							label="Name"
							isRequired
							variant="bordered"
						/>
						<Checkbox
							value="true"
							isSelected={enabled}
							onValueChange={setEnabled}
							name="enabled"
						>
							Enabled
						</Checkbox>
					</ModalBody>
					<ModalFooter>{props.footer} </ModalFooter>
				</ModalContent>
			</Form>
		</Modal>
	);
}
