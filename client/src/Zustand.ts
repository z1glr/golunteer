"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
	user: User | null;
	reset: (zustand?: Partial<Zustand>) => void;
}

const initialState = {
	user: null,
};

const zustand = create<Zustand>()(
	persist(
		(set) => ({
			...initialState,
			reset: (newZustand) =>
				set({
					...initialState,
					...newZustand,
				}),
		}),
		{
			name: "golunteer-storage",
			partialize: (state) =>
				Object.fromEntries(
					Object.entries(state).filter(([key]) => ["user"].includes(key)),
				),
		},
	),
);

export default zustand;
