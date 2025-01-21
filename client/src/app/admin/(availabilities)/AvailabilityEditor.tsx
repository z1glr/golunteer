import ColorSelector from "@/components/Colorselector";
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

export interface Availability {
	name: string;
	color: string;
	id: number | undefined;
	enabled: boolean;
}

export default function AvailabilityEditor(props: {
	header: React.ReactNode;
	footer: React.ReactNode;
	value?: Availability;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSubmit?: (e: Availability) => void;
}) {
	const [name, setName] = useState(props.value?.name ?? "");
	const [color, setColor] = useState(props.value?.color ?? "Red");
	const [enabled, setEnabled] = useState(props.value?.enabled ?? true);

	// clear the inputs on closing
	useEffect(() => {
		if (!props.isOpen) {
			setName("");
			setColor("");
			setEnabled(true);
		}
	}, [props.isOpen]);

	function submit(e: FormEvent<HTMLFormElement>) {
		const formData = Object.fromEntries(new FormData(e.currentTarget)) as {
			name: string;
			color: string;
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
							name="name"
							label="Name"
							isRequired
							variant="bordered"
						/>
						<ColorSelector
							isRequired
							value={color}
							onValueChange={setColor}
							name="color"
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
