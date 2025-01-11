"use client";

import { DateFormatter as IntlDateFormatter } from "@internationalized/date";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
	tasks?: Record<number, { text: string; disabled: boolean }>;
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
