import { AddLarge, Copy } from "@carbon/icons-react";
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
import { FormEvent, useState } from "react";

export default function AddUser(props: {
	isOpen: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}) {
	const [password, setPassword] = useState("");

	return (
		<Modal
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			shadow={"none" as "sm"}
			backdrop="blur"
			className="bg-accent-5"
		>
			<ModalContent>
				<ModalHeader>
					<h1 className="text-2xl">Add User</h1>
				</ModalHeader>

				<Form
					validationBehavior="native"
					onSubmit={(e) => {
						e.preventDefault();
						props.onSubmit?.(e);
					}}
				>
					<ModalBody className="w-full">
						<Input
							isRequired
							type="user"
							label="Name"
							name="userName"
							variant="bordered"
						/>
						<Input
							isRequired
							label="Password"
							name="password"
							variant="bordered"
							endContent={
								<Button
									isIconOnly
									variant="light"
									onPress={() => navigator.clipboard.writeText(password)}
								>
									<Copy />
								</Button>
							}
							value={password}
							onValueChange={setPassword}
						/>
						<Checkbox value="admin" name="admin">
							Admin
						</Checkbox>
					</ModalBody>
					<ModalFooter>
						<Button type="submit" color="primary" startContent={<AddLarge />}>
							Add User
						</Button>
					</ModalFooter>
				</Form>
			</ModalContent>
		</Modal>
	);
}
