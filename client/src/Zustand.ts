"use client";

import { DateFormatter as IntlDateFormatter } from "@internationalized/date";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiCall } from "./lib";

export type Task = string;

export type Availability = string;

export const Availabilities: Availability[] = ["yes", "maybe", "no"];

export interface EventData {
	id: number;
	date: string;
	tasks: Partial<Record<Task, string | null>>;
	description: string;
}

interface Zustand {
	events: EventData[];
	pendingEvents: number;
	user: {
		userName: string;
		admin: boolean;
	} | null;
	setEvents: (events: EventData[]) => void;
	reset: (zustand?: Partial<Zustand>) => void;
	setPendingEvents: (c: number) => void;
}

const initialState = {
	events: [],
	user: null,
	pendingEvents: 0,
};

const zustand = create<Zustand>()(
	persist(
		(set) => ({
			...initialState,
			setEvents: (events) => set({ events }),
			reset: (newZustand) =>
				set({
					...initialState,
					...newZustand,
				}),
			setPendingEvents: (c) => set(() => ({ pendingEvents: c })),
		}),
		{
			name: "golunteer-storage",
			partialize: (state) =>
				Object.fromEntries(
					Object.entries(state).filter(([key]) => !["events"].includes(key)),
				),
		},
	),
);

export async function getTasks(): Promise<
	Record<number, { text: string; disabled: boolean }>
> {
	const result = await apiCall<{ text: string; disabled: boolean }[]>(
		"GET",
		"tasks",
	);

	if (result.ok) {
		const tasks = await result.json();

		return tasks;
	} else {
		return [];
	}
}

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
