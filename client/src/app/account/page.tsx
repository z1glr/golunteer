"use client";

import { apiCall, vaidatePassword as validatePassword } from "@/lib";
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Form,
	Input,
} from "@nextui-org/react";
import { FormEvent, useState } from "react";

export default function Account() {
	const [password, setPassword] = useState("");
	const errors = validatePassword(password);

	async function changePassword(e: FormEvent<HTMLFormElement>) {
		const data = Object.fromEntries(new FormData(e.currentTarget));

		const result = await apiCall("PATCH", "users/password", undefined, data);

		if (result.ok) {
			setPassword("");
		}
	}

	return (
		<>
			<h2 className="text-center text-4xl">Account</h2>
			<div>
				<Card className="max-w-md">
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
						<CardBody>
							<Input
								isRequired
								label="Password"
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
