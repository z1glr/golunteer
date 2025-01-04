import { create } from "zustand";

export enum Task {
	Audio = "Audio",
	Livestream = "Livestream",
	Camera = "Camera",
	Light = "Light",
	StreamAudio = "Stream Audio",
}

export type TaskKey = keyof typeof Task;
export const Tasks = Object.values(Task) as Task[];

export interface EventData {
	id: number;
	date: string;
	tasks: Partial<Record<Task, string | undefined>>;
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
			date: "2025-01-05",
			tasks: {
				Audio: "Mark",
				Livestream: undefined,
				"Stream Audio": undefined,
			},
			description: "neuer Prädikant",
		},
		{
			id: 1,
			date: "2025-01-12",
			tasks: {
				Audio: "Mark",
				Livestream: undefined,
			},
			description: "",
		},
	],
	addEvent: (event: EventData) =>
		set((state) => ({ events: state.events.toSpliced(-1, 0, event) })),
}));

export function ISODate(dt: string | Date): string {
	if (typeof dt === "string") {
		dt = new Date(dt);
	}

	const year = String(dt.getFullYear()).padStart(4, "0");
	const month = String(dt.getMonth() + 1).padStart(2, "0");
	const day = String(dt.getDate()).padStart(2, "0");

	const date = `${year}-${month}-${day}`;

	console.debug(date);

	return date;
}

export default zustand;
