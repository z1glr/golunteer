"use local";

import { DateFormatter } from "@/Zustand";
import { parseZonedDateTime } from "@internationalized/date";
import { useLocale } from "@react-aria/i18n";

export default function LocalDate(props: {
	children: string;
	className?: string;
	options: Intl.DateTimeFormatOptions;
}) {
	const formatter = new DateFormatter(useLocale().locale, props.options);

	return (
		<span className={props.className}>
			{formatter.format(parseZonedDateTime(props.children).toDate())}
		</span>
	);
}
