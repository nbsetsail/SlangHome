/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Theme colors for dynamic theme switching
    { pattern: /^(bg|text|border)-(blue|green|purple|orange|teal|rose)-(50|100|200|300|400|500|600|700)$/ },
    { pattern: /^hover:(bg|text|border)-(blue|green|purple|orange|teal|rose)-(100|200|300|400|500|600|700)$/ },
    { pattern: /^active:(bg|text|border)-(blue|green|purple|orange|teal|rose)-(100|200|300|400|500|600|700)$/ },
    { pattern: /^focus:border-(blue|green|purple|orange|teal|rose)-(400|500)$/ },
    { pattern: /^focus:ring-(blue|green|purple|orange|teal|rose)-(200|300|400)$/ },
    'focus:outline-none',
    'focus:ring-2',
    // Tag colors with opacity (bg-color-50/60)
    'bg-blue-50/60',
    'bg-green-50/60',
    'bg-purple-50/60',
    'bg-orange-50/60',
    'bg-teal-50/60',
    'bg-rose-50/60',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}