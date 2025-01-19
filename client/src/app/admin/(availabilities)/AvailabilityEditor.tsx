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
import React, { FormEvent, useState } from "react";

export interface Availability {
	text: string;
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
	const [text, setText] = useState(props.value?.text ?? "");
	const [color, setColor] = useState(props.value?.color ?? "Red");
	const [enabled, setEnabled] = useState(props.value?.enabled ?? true);

	function submit(e: FormEvent<HTMLFormElement>) {
		const formData = Object.fromEntries(new FormData(e.currentTarget)) as {
			text: string;
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
							value={text}
							onValueChange={setText}
							name="text"
							label="Text"
							isRequired
							variant="bordered"
						/>
						<ColorSelector
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
