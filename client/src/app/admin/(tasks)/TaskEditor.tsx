import { Task } from "@/lib";
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
	const [name, setName] = useState(props.value?.name ?? "");
	const [enabled, setEnabled] = useState(props.value?.enabled ?? true);

	// clear the inputs on closing
	useEffect(() => {
		if (!props.isOpen) {
			setName("");
			setEnabled(true);
		}
	}, [props.isOpen]);

	function submit(e: FormEvent<HTMLFormElement>) {
		const formData = Object.fromEntries(new FormData(e.currentTarget)) as {
			name: string;
			enabled: string;
		};

		props.onSubmit?.({
			...formData,
			id: props.value?.id,
			enabled: formData.enabled == "true",
		});
	}

	return (
		<Modal
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			shadow={"none" as "sm"}
		>
			<Form
				validationBehavior="native"
				onSubmit={(e) => {
					e.preventDefault();
					submit(e);
				}}
				className="w-fit border-2"
			>
				<ModalContent>
					<ModalHeader>
						<h1>{props.header}</h1>
					</ModalHeader>
					<ModalBody>
						<Input
							value={name}
							onValueChange={setName}
							name="name"
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
