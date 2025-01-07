"use client";

import { Divider } from "@nextui-org/divider";
import { Link } from "@nextui-org/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Footer({
	sites,
}: {
	sites: { href: string; text: string }[];
}) {
	const pathname = usePathname();

	return (
		<>
			{sites.map((footer, ii, footerSites) => (
				<React.Fragment key={ii}>
					<Link
						href={footer.href}
						color={pathname === footer.href ? "danger" : "foreground"}
					>
						{footer.text}
					</Link>
					{ii != footerSites.length - 1 ? (
						<Divider orientation="vertical" />
					) : null}
				</React.Fragment>
			))}
		</>
	);
}
