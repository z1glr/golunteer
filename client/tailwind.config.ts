import type { Config } from "tailwindcss";

export default {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}"
	],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				primary: "var(--primary)",
				highlight: "var(--highlight)",
				"accent-1": "var(--accent-1)",
				"accent-2": "var(--accent-2)",
				"accent-3": "var(--accent-3)",
				"accent-4": "var(--accent-4)",
				"accent-5": "var(--accent-5)"
			}
		},
		fontFamily: {
			"display-headline": ["pilowlava"],
			headline: ["spacegrotesk"],
			subheadline: ["uncut-sans"],
			body: ["uncut-sans"],
			numbers: ["space-mono"]
		}
	},
	plugins: []
} satisfies Config;
