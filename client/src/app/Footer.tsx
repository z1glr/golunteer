"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { SiteLink } from "./layout";
import { Divider, Link } from "@nextui-org/react";

export default function Footer({ sites }: { sites: SiteLink[] }) {
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
