"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiCall } from "./lib";

export interface EventData {
	id: number;
	date: string;
	tasks: Partial<Record<string, string | null>>;
	description: string;
}

export interface User {
	userName: string;
	admin: boolean;
}

interface Zustand {
	events: EventData[];
	pendingEvents: number;
	user: User | null;
	setEvents: (events: EventData[]) => void;
	reset: (zustand?: Partial<Zustand>) => void;
	getPendingEvents: () => Promise<void>;
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
			getPendingEvents: async () => {
				const result = await apiCall<{ pendingEvents: number }>(
					"GET",
					"events/user/pending",
				);

				if (result.ok) {
					const resultData = await result.json();

					set(() => ({ pendingEvents: resultData }));
				}
			},
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

export default zustand;
