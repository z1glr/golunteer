import { DateFormatter as IntlDateFormatter } from "@internationalized/date";
import zustand from "./Zustand";
import { Availability } from "./app/admin/(availabilities)/AvailabilityEditor";

type QueryParams = Record<string, string | { toString(): string }>;

export type APICallResult<T extends object> = Response & {
	json: () => Promise<T>;
};

export async function apiCall<K extends object>(
	method: "GET",
	api: string,
	query?: QueryParams,
): Promise<APICallResult<K>>;
export async function apiCall<K extends object>(
	method: "POST" | "PATCH" | "PUT",
	api: string,
	query?: QueryParams,
	body?: object,
): Promise<APICallResult<K>>;
export async function apiCall<K extends object>(
	method: "DELETE",
	api: string,
	query?: QueryParams,
	body?: object,
): Promise<APICallResult<K>>;
export async function apiCall<K extends object>(
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
	api: string,
	query?: QueryParams,
	body?: object,
): Promise<APICallResult<K>> {
	let url = window.origin + "/api/" + api;

	if (query) {
		const urlsearchparams = new URLSearchParams(
			Object.fromEntries(
				Object.entries(query).map(([key, value]): [string, string] => {
					if (typeof value !== "string") {
						return [key, value.toString()];
					} else {
						return [key, value];
					}
				}),
			),
		);

		url += "?" + urlsearchparams.toString();
	}

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json; charset=UTF-8",
		},
		credentials: "include",
		method,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	return response;
}

export function classNames(classNames: Record<string, boolean>): string {
	return Object.entries(classNames)
		.map(([classString, value]) => {
			if (value) {
				return classString;
			}
		})
		.join(" ");
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

export function vaidatePassword(password: string): string[] {
	const errors = [];

	if (password.length < 12) {
		errors.push("Password must be 12 characters or more");
	} else if (password.length > 64) {
		errors.push("Password must be 64 characters or short");
	}

	return errors;
}

export interface Task {
	id: number | undefined;
	name: string;
	enabled: boolean;
}

export async function getTask(name: string): Promise<Task | undefined> {
	// get the tasks
	const tasks = await getTasks();

	return tasks.find((t) => t.name === name);
}

export async function getTasks(): Promise<Task[]> {
	// check wether it is cached in zustand
	const state = zustand.getState();

	if (!!state.tasks) {
		return state.tasks;
	} else {
		const result = await apiCall<Task[]>("GET", "tasks");

		if (result.ok) {
			const tasks = (await result.json()) as Task[];

			state.patch({ tasks: tasks });

			return tasks;
		} else {
			return [];
		}
	}
}

export async function getAvailabilities(): Promise<Availability[]> {
	// check wether it is cached in zustand
	const state = zustand.getState();

	if (!!state.availabilities) {
		return state.availabilities;
	} else {
		const result = await apiCall<Task[]>("GET", "availabilities");

		if (result.ok) {
			const tasks = await result.json();

			state.patch({ availabilities: tasks });

			return tasks;
		} else {
			return [];
		}
	}
}
