import { Filter } from "@carbon/icons-react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import React from "react";

export default function FilterPopover({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Popover placement="bottom-end">
			<PopoverTrigger className={className}>
				<Button isIconOnly>
					<Filter className="cursor-pointer" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="gap-2 p-2">{children}</PopoverContent>
		</Popover>
	);
}
