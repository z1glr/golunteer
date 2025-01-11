"use client";

import { apiCall } from "@/lib";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@carbon/icons-react";
import {
	Avatar,
	Badge,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Link,
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenu,
	NavbarMenuToggle,
} from "@nextui-org/react";
import zustand from "@/Zustand";
import { SiteLink } from "./layout";
import React, { useEffect } from "react";

export default function Header({ sites }: { sites: SiteLink[] }) {
	const router = useRouter();
	const user = zustand((state) => state.user);
	const pendingEvents = zustand((state) => state.pendingEvents);

	const pathname = usePathname();

	const badgeSites: {
		content: React.ReactNode;
		onPress?: () => void;
		color?: "primary" | "secondary" | "success" | "warning" | "danger";
		textValue?: string;
	}[] = [
		{
			content: (
				<>
					<p>Signed in as</p>
					<p className="text-primary">{user?.userName}</p>
				</>
			),
			textValue: `Signed in as ${user?.userName}`,
		},
		{
			content: "Account",
			onPress: () => router.push("/account"),
		},
		{
			content: <span className="text-danger">Logout</span>,
			onPress: logout,
			color: "danger",
			textValue: "Logout",
		},
	];

	async function logout() {
		const result = await apiCall("GET", "logout");

		// if the request was successfull, redirect to the login-page
		if (result.ok) {
			// clear the zustand
			zustand.getState().reset();

			router.push("/login");
		}
	}

	// get the pending events for the counter
	useEffect(() => {
		(async () => {
			const result = await apiCall<{ pendingEvents: number }>(
				"GET",
				"events/user/pending",
			);

			if (result.ok) {
				const resultJson = await result.json();
				zustand.getState().setPendingEvents(resultJson);
			}
		})();
	}, []);

	return (
		<div>
			<Navbar maxWidth="full">
				<NavbarContent>
					<NavbarMenuToggle className="sm:hidden" />
					<NavbarBrand onClick={() => router.push("/")}>
						<h1 className="font-display-headline text-xl">Golunteer</h1>
					</NavbarBrand>
				</NavbarContent>
				{user !== null ? (
					<>
						<NavbarMenu className="pt-4">
							{sites.map((s) =>
								// if the site is no admin-site or the user is an admin, render it
								!s.admin || user.admin ? (
									<Link
										key={s.href}
										href={s.href}
										color={pathname === s.href ? "primary" : "foreground"}
									>
										{s.text}
									</Link>
								) : null,
							)}
						</NavbarMenu>

						<NavbarContent justify="center" className="hidden sm:flex">
							{sites.map((s) =>
								// if the site is no admin-site or the user is an admin, render it
								!s.admin || user.admin ? (
									<NavbarItem key={s.href} isActive={pathname === s.href}>
										<Link
											href={s.href}
											color={pathname === s.href ? "primary" : "foreground"}
										>
											{s.text}
										</Link>
									</NavbarItem>
								) : null,
							)}
						</NavbarContent>

						<NavbarContent justify="end">
							<Dropdown placement="bottom-end">
								<Badge
									content={pendingEvents}
									color="danger"
									aria-label={`${pendingEvents} notifications`}
								>
									<DropdownTrigger>
										<Avatar isBordered as="button" icon={<User size={32} />} />
									</DropdownTrigger>
								</Badge>
								<DropdownMenu variant="flat">
									{badgeSites.map((site, ii) => (
										<DropdownItem
											key={ii}
											onPress={site.onPress}
											color={site.color}
											textValue={site.textValue}
										>
											{site.content}
										</DropdownItem>
									))}
								</DropdownMenu>
							</Dropdown>
						</NavbarContent>
					</>
				) : null}
			</Navbar>
		</div>
	);
}
