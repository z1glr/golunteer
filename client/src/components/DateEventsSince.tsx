import { DatePicker, DateValue } from "@heroui/react";

export default function DateEventsSince({
	sinceDate,
	setSinceDate,
	className,
}: {
	sinceDate: DateValue | null;
	setSinceDate: (value: DateValue | null) => void;
	className?: string;
}) {
	return (
		<DatePicker
			className={className}
			value={sinceDate}
			hideTimeZone
			onChange={setSinceDate}
			label="Show events since"
		/>
	);
}
