"use local";

import { DateFormatter } from "@/Zustand";
import { useLocale } from "@react-aria/i18n";

export default function LocalDate(props: {
	children: Date;
	className?: string;
	options: Intl.DateTimeFormatOptions;
}) {
	const formatter = new DateFormatter(useLocale().locale, props.options);

	return (
		<span className={props.className}>{formatter.format(props.children)}</span>
	);
}
