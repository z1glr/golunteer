import {
	DateFormatter as IntlDateFormatter,
	parseZonedDateTime,
	ZonedDateTime,
} from "@internationalized/date";
import { create } from "zustand";

export type Task = string;

export const Tasks: Task[] = [
	"Audio",
	"Livestream",
	"Camera",
	"Light",
	"Stream Audio",
];

export type Availability = string;

export const Availabilities: Availability[] = ["yes", "maybe", "no"];

export interface EventData {
	id: number;
	date: ZonedDateTime;
	tasks: Partial<Record<Task, string | undefined>>;
	volunteers: Partial<Record<string, Availability>>;
	description: string;
}

interface Zustand {
	events: EventData[];
	addEvent: (event: EventData) => void;
}

const zustand = create<Zustand>()((set) => ({
	events: [
		{
			id: 0,
			// date: parseDateTime("2025-01-05T11:00[Europe/Berlin]").toString(),
			date: parseZonedDateTime("2025-01-05T11:00[Europe/Berlin]"),
			tasks: {
				Audio: "Mark",
				Livestream: undefined,
				"Stream Audio": undefined,
			},
			volunteers: { Mark: "yes", Simon: "maybe", Sophie: "no" },
			description: "neuer Prädikant",
		},
		{
			id: 1,
			date: parseZonedDateTime("2025-01-12T11:00[Europe/Berlin]"),
			tasks: {
				Audio: "Mark",
				Livestream: undefined,
			},
			volunteers: { Mark: "yes", Simon: "maybe" },
			description: "",
		},
	],
	addEvent: (event: EventData) =>
		set((state) => ({ events: state.events.toSpliced(-1, 0, event) })),
}));

export class DateFormatter {
	private formatter;

	constructor(locale: string, options?: Intl.DateTimeFormatOptions) {
		this.formatter = new IntlDateFormatter(locale, options);
	}

	format(dt: Date) {
		return this.formatter.format(dt);
	}
}

export default zustand;
