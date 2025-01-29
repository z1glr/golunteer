"use client";

import { create } from "zustand";
import { Task } from "./lib";
import { Availability } from "./app/admin/(availabilities)/AvailabilityEditor";

export interface BaseEvent {
	eventID: number;
	date: string;
	description: string;
}

export type EventAvailability = BaseEvent & {
	availability: number;
};

export type EventData = BaseEvent & {
	tasks: TaskAssignment[];
};

export type EventDataWithAvailability = EventData & EventAvailability;

export interface TaskAssignment {
	taskID: number;
	taskName: string;
	userName: string | null;
}

export interface StateUser {
	userName: string;
	admin: boolean;
}

export type User = StateUser & {
	possibleTasks: number[];
};

export type UserAddModify = User & {
	password: string;
};

interface Zustand {
	user: StateUser | null;
	tasks?: Task[];
	availabilities?: Availability[];
	users?: User[];
	patch: (zustand?: Partial<Zustand>) => void;
	reset: (zustand?: Partial<Zustand>) => void;
}

const initialState = {
	user: null,
};

const zustand = create<Zustand>()(
	// persist(
	(set, get) => ({
		...initialState,
		reset: (newZustand) => {
			set({
				...initialState,
				...newZustand,
			});
		},
		patch: (patch) => set({ ...get(), ...patch }),
	}),
	// {
	// 	name: "golunteer-storage",
	// 	partialize: (state) =>
	// 		Object.fromEntries(
	// 			Object.entries(state).filter(([key]) =>
	// 				["user", "tasksList", "tasksMap"].includes(key),
	// 			),
	// 		),
	// },
	// ),
);

export default zustand;
