import type { Metadata } from "next";
import "./globals.css";
import { NextUIProvider } from "@nextui-org/system";
import React from "react";
import Footer from "./Footer";
import Header from "./Header";
import Main from "./Main";

export const metadata: Metadata = {
	title: "Create Next App",
	description: "Generated by create next app",
};

export interface SiteLink {
	text: string;
	href: string;
	admin?: boolean;
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const headerSites: SiteLink[] = [
		{
			text: "Overview",
			href: "/",
		},
		{
			text: "Events",
			href: "/events",
		},
		{
			text: "Assignments",
			href: "/assignments",
		},
		{
			text: "Assign Tasks",
			href: "/admin/assign",
			admin: true,
		},
		{
			text: "Users",
			href: "/admin/users",
			admin: true,
		},
		{
			text: "Configuration",
			href: "/admin/config",
			admin: true,
		},
	];

	const footerSites: SiteLink[] = [
		{
			text: "Impressum",
			href: "/impressum",
		},
		{
			text: "Datenschutz",
			href: "/datenschutz",
		},
	];

	return (
		<html>
			<body className="bg-background text-foreground antialiased">
				<NextUIProvider>
					<div className="flex min-h-screen flex-col p-4">
						<header>
							<Header sites={headerSites} />
						</header>
						<main className="flex min-h-full flex-1 flex-col p-4">
							<Main>{children}</Main>
						</main>
						<footer className="flex h-4 justify-center gap-4">
							<Footer sites={footerSites} />
						</footer>
					</div>
				</NextUIProvider>
			</body>
		</html>
	);
}
