import type { Metadata } from "next";
import "./globals.css";
import { HeroUIProvider } from "@heroui/system";
import React from "react";
import Footer from "./Footer";
import Header from "./Header";
import Main from "./Main";

export const metadata: Metadata = {
	title: "Golunteer",
	description: "Volunteeer coordination",
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
			text: "Availabilities",
			href: "/availabilities",
		},
		{
			text: "Assignments",
			href: "/assignments",
			admin: true,
		},
		{
			text: "Admin",
			href: "/admin",
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
				<HeroUIProvider>
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
				</HeroUIProvider>
			</body>
		</html>
	);
}
