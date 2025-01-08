"use client";

import { ViewFilled, ViewOffFilled } from "@carbon/icons-react";
import { Button } from "@nextui-org/button";
import { Form } from "@nextui-org/form";
import { Input } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { useState } from "react";

export default function Login() {
	const [visibility, setVisibility] = useState(false);

	return (
		<div>
			<h2 className="mb-4 text-center text-4xl">Login</h2>
			<Form
				validationBehavior="native"
				className="flex flex-col items-center gap-2"
				onSubmit={(e) => e.preventDefault()}
			>
				<Input
					isRequired
					type="user"
					label="Name"
					name="username"
					variant="bordered"
					className="max-w-xs"
				/>
				<Input
					isRequired
					label="Password"
					name="password"
					autoComplete="current-password"
					endContent={
						<Switch
							className="my-auto"
							startContent={<ViewFilled />}
							endContent={<ViewOffFilled />}
							onValueChange={setVisibility}
							isSelected={visibility}
						/>
					}
					type={visibility ? "text" : "password"}
					variant="bordered"
					className="max-w-xs"
				/>
				<Button className="w-full max-w-xs" color="primary" type="submit">
					Login
				</Button>
			</Form>
		</div>
	);
}
