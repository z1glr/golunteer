import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";
import React from "react";
import { TrashCan } from "@carbon/icons-react";

export default function DeleteConfirmation(props: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	children: React.ReactNode;
	itemName: string;
	onDelete?: () => void;
}) {
	return (
		<Modal
			isOpen={props.isOpen}
			onOpenChange={(isOpen) => {
				props.onOpenChange(isOpen);
			}}
			shadow={"none" as "sm"}
			backdrop="blur"
			className="bg-accent-5"
		>
			<ModalContent>
				<ModalHeader>
					<h1 className="text-2xl">Delete {props.itemName}</h1>
				</ModalHeader>
				<ModalBody>{props.children}</ModalBody>
				<ModalFooter>
					<Button variant="bordered" onPress={() => props.onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						startContent={<TrashCan />}
						color="danger"
						onPress={() => props.onDelete?.()}
					>
						Delete {props.itemName}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
