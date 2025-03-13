import { Chip, ChipProps } from "@heroui/react";
import { color2Tailwind } from "./Colorselector";
import { Availability } from "@/app/admin/(availabilities)/AvailabilityEditor";

export default function AvailabilityChip({
	children,
	className,
}: {
	children?: Availability;
	className?: string;
	classNames?: ChipProps["classNames"];
}) {
	return !!children ? (
		<Chip
			classNames={{
				base: `bg-${color2Tailwind(children.color)}`,
			}}
			className={className}
		>
			{children.availabilityName}
		</Chip>
	) : null;
}
