"use client";

import { apiCall } from "@/lib";
import zustand from "@/Zustand";
import { Spinner } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

enum AuthState {
	LoggedIn,
	LoginScreen,
	Unauthorized,
	Loading,
}

export default function Main({ children }: { children: React.ReactNode }) {
	const [auth, setAuth] = useState(AuthState.Loading);

	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		void (async () => {
			let loggedIn = false;

			const welcomeResult = await apiCall<{
				userName: string;
				loggedIn: boolean;
			}>("GET", "welcome");

			if (welcomeResult.ok) {
				try {
					const response = await welcomeResult.json();

					if (response.userName !== undefined && response.userName !== "") {
						zustand.getState().patch({ user: response });

						loggedIn = true;
					}
				} catch {}
			} else {
				zustand.getState().reset();
			}

			if (pathname === "/login") {
				if (loggedIn) {
					router.push("/");
				} else {
					setAuth(AuthState.LoginScreen);
				}
			} else {
				if (loggedIn) {
					setAuth(AuthState.LoggedIn);
				} else {
					setAuth(AuthState.Unauthorized);
					router.push("/login");
				}
			}
		})();
	}, [pathname, router]);

	switch (auth) {
		case AuthState.Loading:
			return <Spinner label="Loading..." />;
		case AuthState.LoggedIn:
		case AuthState.LoginScreen:
			return children;
		case AuthState.Unauthorized:
			return "";
	}
}
