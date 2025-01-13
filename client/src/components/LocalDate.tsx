"use local";

import { DateFormatter } from "@/lib";
import { getLocalTimeZone, parseDateTime } from "@internationalized/date";
import { useLocale } from "@react-aria/i18n";

export default function LocalDate(props: {
	children?: string;
	className?: string;
	options: Intl.DateTimeFormatOptions;
}) {
	const formatter = new DateFormatter(useLocale().locale, props.options);

	return (
		<span className={props.className}>
			{props.children !== undefined
				? formatter.format(
						parseDateTime(props.children).toDate(getLocalTimeZone()),
					)
				: ""}
		</span>
	);
}
