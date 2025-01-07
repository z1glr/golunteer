import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/theme";

const HIGHLIGHT = "#ff5053";
const FOREGROUND = "#fef2ff";
const ACCENT1 = "#b2aaff";
const ACCENT2 = "#6a5fdb";
const ACCENT3 = "#261a66";
const ACCENT4 = "#29114c";
const ACCENT5 = "#190b2f";
const BACKGROUND = "#0f000a";

export default {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				highlight: HIGHLIGHT,
				foreground: {
					DEFAULT: FOREGROUND,
					"50": FOREGROUND,
					"100": FOREGROUND,
					"200": FOREGROUND,
					"300": FOREGROUND,
					"400": FOREGROUND,
					"500": FOREGROUND,
					"600": "#fce8ff",
					"700": "#fad0fe",
					"800": "#f8abfc",
					"900": "#f579f9",
					"950": "#eb46ef",
				},
				"accent-1": ACCENT1,
				"accent-2": ACCENT2,
				"accent-3": ACCENT3,
				"accent-4": ACCENT4,
				"accent-5": ACCENT5,
				background: BACKGROUND,
			},
			boxShadow: {
				border: `inset 0 0 0 2px ${ACCENT2}`,
			},
		},
		fontFamily: {
			"display-headline": ["pilowlava"],
			headline: ["spacegrotesk"],
			subheadline: ["uncut-sans"],
			body: ["uncut-sans"],
			numbers: ["space-mono"],
		},
	},
	darkMode: "class",
	plugins: [
		nextui({
			defaultTheme: "dark",
			defaultExtendTheme: "dark",
			themes: {
				dark: {
					colors: {
						// default: {
						// 	DEFAULT: ACCENT2,
						// },
						primary: {
							DEFAULT: ACCENT2,
							"50": "#39357a",
							"100": "#42399a",
							"200": "#5144be",
							"300": ACCENT2,
							"400": "#6f6ee6",
							"500": "#8b91ee",
							"600": "#acb7f5",
							"700": "#cbd3fa",
							"800": "#e2e7fd",
							"900": "#eff3fe",
						},
						secondary: {
							DEFAULT: ACCENT3,
							"50": "#3b288a",
							"100": "#462fa8",
							"200": "#5538c9",
							"300": "#634add",
							"400": "#776ae8",
							"500": "#9a95f0",
							"600": "#bdbcf6",
							"700": "#dadbfa",
							"800": "#ebebfc",
							"900": "#f4f4fe",
						},
						// background: {
						// 	DEFAULT: BACKGROUND,
						// },
						danger: {
							DEFAULT: HIGHLIGHT,
							"50": "#fff1f1",
							"100": "#ffe1e2",
							"200": "#ffc7c8",
							"300": "#ffa0a2",
							"400": HIGHLIGHT,
							"500": "#f83b3e",
							"600": "#e51d20",
							"700": "#c11417",
							"800": "#a01416",
							"900": "#84181a",
						},
					},
				},
			},
		}),
	],
} satisfies Config;
