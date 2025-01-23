import { Chip, ChipProps } from "@heroui/react";
import { color2Tailwind } from "./Colorselector";
import { Availability } from "@/app/admin/(availabilities)/AvailabilityEditor";

export default function AvailabilityChip({
	availability,
	className,
}: {
	availability?: Availability;
	className?: string;
	classNames?: ChipProps["classNames"];
}) {
	return !!availability ? (
		<Chip
			classNames={{
				base: `bg-${color2Tailwind(availability.color)}`,
			}}
			className={className}
		>
			{availability.availabilityName}
		</Chip>
	) : null;
}
