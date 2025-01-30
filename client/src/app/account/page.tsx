"use client";

import { apiCall, validatePassword as validatePassword } from "@/lib";
import {
	Alert,
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Form,
	Input,
} from "@heroui/react";
import { FormEvent, useState } from "react";

export default function Account() {
	const [password, setPassword] = useState("");
	const [showSuccess, setShowSuccess] = useState(false);

	const errors = validatePassword(password);

	async function changePassword(e: FormEvent<HTMLFormElement>) {
		const data = Object.fromEntries(new FormData(e.currentTarget));

		const result = await apiCall("PUT", "users/password", undefined, data);

		if (result.ok) {
			setPassword("");
			setShowSuccess(true);
		}
	}

	return (
		<>
			<h2 className="mb-4 text-center text-4xl">Account</h2>
			<div>
				<Card className="mx-auto max-w-md bg-accent-5" shadow="none">
					<CardHeader>
						<h3 className="text-2xl">Change Password</h3>
					</CardHeader>

					<Form
						validationBehavior="native"
						onSubmit={(e) => {
							e.preventDefault();
							changePassword(e);
						}}
					>
						<CardBody className="flex flex-col gap-2">
							<Input
								isRequired
								label="New password"
								name="password"
								variant="bordered"
								value={password}
								onValueChange={setPassword}
								isInvalid={password.length > 0 && errors.length > 0}
								errorMessage={
									<ul>
										{errors.map((e, ii) => (
											<li key={ii}>{e}</li>
										))}
									</ul>
								}
							/>
							<Alert
								hideIconWrapper
								isVisible={showSuccess}
								onClose={() => setShowSuccess(false)}
								title="Success"
								color="success"
								variant="faded"
							>
								Password changed successfully
							</Alert>
						</CardBody>
						<CardFooter>
							<Button
								type="submit"
								color="primary"
								isDisabled={errors.length > 0}
							>
								Change password
							</Button>
						</CardFooter>
					</Form>
				</Card>
			</div>
		</>
	);
}
