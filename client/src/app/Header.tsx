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
} from "@nextui-org/react";
import zustand from "@/Zustand";
import { SiteLink } from "./layout";
import { useEffect } from "react";

export default function Header({ sites }: { sites: SiteLink[] }) {
	const router = useRouter();
	const user = zustand((state) => state.user);
	const pendingEvents = zustand((state) => state.pendingEvents);

	const pathname = usePathname();

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
				<NavbarBrand onClick={() => router.push("/")}>
					<h1 className="font-display-headline text-xl">Golunteer</h1>
				</NavbarBrand>

				{user !== null ? (
					<>
						<NavbarContent justify="center">
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
									<DropdownItem
										key="profile"
										className="h-14 gap-2"
										textValue={`signed in as ${user.userName}`}
									>
										<p>Signed in as</p>
										<p className="text-primary">{user.userName}</p>
									</DropdownItem>
									<DropdownItem
										key="account"
										onPress={() => router.push("/account")}
									>
										Account
									</DropdownItem>
									<DropdownItem
										key="logout"
										color="danger"
										onPress={logout}
										className="text-danger"
									>
										Log Out
									</DropdownItem>
								</DropdownMenu>
							</Dropdown>
						</NavbarContent>
					</>
				) : null}
			</Navbar>
		</div>
	);
}
