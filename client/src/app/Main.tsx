"use client";

import { apiCall } from "@/lib";
import { Spinner } from "@nextui-org/spinner";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

enum AuthState {
	Loading,
	LoginScreen,
	Unauthorized,
	LoggedIn,
}

export default function Main({ children }: { children: React.ReactNode }) {
	const [status, setStatus] = useState(AuthState.Loading);

	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		void (async () => {
			if (pathname === "/login") {
				setStatus(AuthState.LoginScreen);
			} else {
				const welcomeResult = await apiCall<{
					userName: string;
					loggedIn: boolean;
				}>("GET", "welcome");

				if (!welcomeResult.ok) {
					router.push("/login");
				} else {
					const response = await welcomeResult.json();

					if (response.loggedIn) {
						setStatus(AuthState.LoggedIn);
					} else {
						setStatus(AuthState.Unauthorized);
					}
				}
			}
		})();
	});

	switch (status) {
		case AuthState.Loading:
			return <Spinner label="Loading..." />;
		case AuthState.LoggedIn:
		case AuthState.LoginScreen:
			return children;
		case AuthState.Unauthorized:
			return "";
	}
}
