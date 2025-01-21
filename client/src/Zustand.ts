"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task } from "./lib";
import { Availability } from "./app/admin/(availabilities)/AvailabilityEditor";

export interface EventData {
	id: number;
	date: string;
	tasks: TaskAssignment[];
	description: string;
}

interface TaskAssignment {
	taskID: number;
	taskName: string;
	userName: string | null;
}

export interface User {
	userName: string;
	admin: boolean;
}

interface Zustand {
	user: User | null;
	tasks?: Task[];
	availabilities?: Availability[];
	patch: (zustand?: Partial<Zustand>) => void;
	reset: (zustand?: Partial<Zustand>) => void;
}

const initialState = {
	user: null,
};

const zustand = create<Zustand>()(
	persist(
		(set, get) => ({
			...initialState,
			reset: (newZustand) => {
				console.debug("reset");
				set({
					...initialState,
					...newZustand,
				});
			},
			patch: (patch) => set({ ...get(), ...patch }),
		}),
		{
			name: "golunteer-storage",
			partialize: (state) =>
				Object.fromEntries(
					Object.entries(state).filter(([key]) =>
						["user", "tasksList", "tasksMap"].includes(key),
					),
				),
		},
	),
);

export default zustand;
