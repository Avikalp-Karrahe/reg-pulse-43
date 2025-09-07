import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				risk: {
					safe: 'hsl(var(--risk-safe))',
					low: 'hsl(var(--risk-low))',
					medium: 'hsl(var(--risk-medium))',
					high: 'hsl(var(--risk-high))',
					critical: 'hsl(var(--risk-critical))',
					'safe-text': 'hsl(var(--risk-safe-text))',
					'low-text': 'hsl(var(--risk-low-text))',
					'medium-text': 'hsl(var(--risk-medium-text))',
					'high-text': 'hsl(var(--risk-high-text))',
					'critical-text': 'hsl(var(--risk-critical-text))'
				},
				neon: {
					cyan: 'hsl(var(--neon-cyan))',
					green: 'hsl(var(--neon-green))',
					yellow: 'hsl(var(--neon-yellow))',
					orange: 'hsl(var(--neon-orange))',
					red: 'hsl(var(--neon-red))',
					purple: 'hsl(var(--neon-purple))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': { filter: 'drop-shadow(0 0 8px currentColor)' },
					'50%': { filter: 'drop-shadow(0 0 20px currentColor) drop-shadow(0 0 32px currentColor)' }
				},
				'type-in': {
					'from': { width: '0', opacity: '0' },
					'to': { width: '100%', opacity: '1' }
				},
				'count-up': {
					'from': { transform: 'scale(1.2)', opacity: '0.5' },
					'to': { transform: 'scale(1)', opacity: '1' }
				},
				'ring-progress': {
					'from': { 'stroke-dasharray': '0 251.2' }
				},
				'hover-lift': {
					'0%': { transform: 'translateY(0) scale(1)' },
					'100%': { transform: 'translateY(-2px) scale(1.02)' }
				},
				'motion-safe': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'type-in': 'type-in 0.6s ease-out forwards',
				'count-up': 'count-up 0.4s ease-out',
				'ring-progress': 'ring-progress 1s ease-out forwards',
				'hover-lift': 'hover-lift 0.12s cubic-bezier(0.16, 0.84, 0.44, 1)',
				'motion-safe': 'motion-safe 0.28s cubic-bezier(0.16, 0.84, 0.44, 1)'
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
