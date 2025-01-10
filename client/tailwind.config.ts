import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/theme";

const HIGHLIGHT = "hsl(359,100%,65.7%)"; // #ff5053
const FOREGROUND = "hsl(295,100%,97.5%)"; // #fef2ff
const ACCENT1 = "hsl(246,100%,83.3%)"; // #b2aaff
const ACCENT2 = "hsl(245,63.3%,61.6%)"; // #6a5fdb
const ACCENT3 = "hsl(249,59.4%,25.1%)"; // #261a66
const ACCENT4 = "hsl(264,63.4%,18.2%)"; // #29114c
const ACCENT5 = "hsl(263,62.1%,11.4%)"; // #190b2f
const BACKGROUND = "hsl(320,100%,2.9%)"; // #0f000a

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
				foreground: FOREGROUND,
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
							"50": "hsl(244,100%,9.6%)",
							"100": "hsl(244,100%,19.2%)",
							"200": "hsl(244,100%,28.8%)",
							"300": "hsl(244,100%,38.4%)",
							"400": "hsl(244,100%,46.7%)",
							"500": "hsl(244,92.5%,58.4%)",
							"600": "hsl(244,92.5%,68.8%)",
							"700": "hsl(244,92.5%,79.2%)",
							"800": "hsl(244,92.5%,89.6%)",
							"900": "hsl(245,92.3%,94.9%)",
						},
						secondary: {
							DEFAULT: ACCENT3,
							"50": "hsl(249,66.7%,9.4%)",
							"100": "hsl(249,66.7%,18.8%)",
							"200": "hsl(249,66.7%,28.2%)",
							"300": "hsl(249,66.7%,37.6%)",
							"400": "hsl(249,66.7%,47.1%)",
							"500": "hsl(249,59.3%,57.6%)",
							"600": "hsl(249,59.3%,68.2%)",
							"700": "hsl(249,59.3%,78.8%)",
							"800": "hsl(249,59.3%,89.4%)",
							"900": "hsl(249,61.5%,94.9%)",
						},
						// background: {
						// 	DEFAULT: BACKGROUND,
						// },
						danger: {
							DEFAULT: HIGHLIGHT,
							"50": "hsl(360,84.9%,10.4%)",
							"100": "hsl(359,86.5%,20.4%)",
							"200": "hsl(359,86%,30.8%)",
							"300": "hsl(359,86.5%,40.8%)",
							"400": "hsl(359,90.4%,51.2%)",
							"500": "hsl(359,90%,60.8%)",
							"600": "hsl(359,90.6%,70.8%)",
							"700": "hsl(359,90%,80.4%)",
							"800": "hsl(360,91.8%,90.4%)",
							"900": "hsl(359,92%,95.1%)",
						},
					},
				},
			},
		}),
	],
} satisfies Config;
