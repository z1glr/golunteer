"use client";

import CheckboxIcon from "@/components/CheckboxIcon";
import { apiCall } from "@/lib";
import zustand, { StateUser } from "@/Zustand";
import {
	ViewFilled,
	ViewOffFilled,
	WarningHexFilled,
} from "@carbon/icons-react";
import { Alert, Button, Form, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Login() {
	const [visibility, setVisibility] = useState(false);
	const [wrongPassword, setWrongPassword] = useState(false);
	const router = useRouter();

	// set login-request
	async function sendLogin(e: FormEvent<HTMLFormElement>) {
		const data = Object.fromEntries(new FormData(e.currentTarget));

		const result = await apiCall<StateUser>("POST", "login", undefined, data);

		if (result.ok) {
			// add the user-info to the zustand
			zustand.getState().reset({ user: await result.json() });

			// redirect to the home-page
			router.push("/");
		} else {
			setWrongPassword(true);
		}
	}

	return (
		<div>
			<h2 className="mb-4 text-center text-4xl">Login</h2>
			<Form
				validationBehavior="native"
				className="mx-auto flex max-w-sm flex-col items-center gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					void sendLogin(e);
				}}
			>
				<Input
					isRequired
					type="user"
					label="Name"
					name="username"
					variant="bordered"
				/>
				<Input
					isRequired
					label="Password"
					name="password"
					autoComplete="current-password"
					endContent={
						<CheckboxIcon
							className="my-auto"
							startContent={<ViewFilled />}
							endContent={<ViewOffFilled />}
							onValueChange={setVisibility}
							isSelected={visibility}
						/>
					}
					type={visibility ? "text" : "password"}
					variant="bordered"
				/>
				<Alert
					title="Login failed"
					description="Wrong username or password"
					color="danger"
					icon={<WarningHexFilled size={32} />}
					hideIconWrapper
					isClosable
					isVisible={wrongPassword}
					onVisibleChange={(v) => setWrongPassword(v)}
				/>
				<Button className="w-full" color="primary" type="submit">
					Login
				</Button>
			</Form>
		</div>
	);
}
