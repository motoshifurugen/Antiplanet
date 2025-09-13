// Antiplanet Color Palette
// Dark cosmic background with warm civilization-growth inspired colors
// Optimized for both day and night viewing - no light theme needed
// Theme: "cold space vs. warm life"

export const colors = {
  // Core civilization colors - warm and nurturing
  primary: '#6FAFE1',        // Sky blue - growth, hope
  secondary: '#8576B0',      // Warm violet-gray - exploration, balance
  success: '#7DC47D',        // Soft green - thriving civilization
  warning: '#E2A45F',        // Amber - natural decline
  error: '#C75B5B',          // Calm red - collapse/failure
  accent: '#D9B86C',         // Gold - achievements, highlights
  
  // Civilization level colors - progression from nature to urban
  grassland: '#8FBC8F',      // Forest green - natural, undeveloped
  village: '#D2B48C',        // Tan - simple, rural development
  town: '#CD853F',           // Peru - moderate development
  city: '#B8860B',           // Dark goldenrod - advanced urban development
  
  // Dark cosmic background - optimized for all lighting conditions
  background: '#0A0A0F',     // Deep cosmic black (slightly lighter for day viewing)
  surface: '#1A1B22',        // Dark surface with subtle contrast
  surfaceSecondary: '#25262E', // Alternative surface for cards
  
  // Text colors - high contrast for readability
  text: '#FFFFFF',            // Pure white for primary text
  textSecondary: '#D1D2D8',  // Light gray for secondary text (better contrast)
  textTertiary: '#A0A1A8',   // Muted text for less important info
  
  // Border and divider colors
  border: '#3A3B42',         // Subtle border color
  borderLight: '#4A4B52',    // Lighter border for subtle separation
  divider: '#2A2B32',        // Dark divider lines
  
  // Interactive elements
  placeholder: '#6A6B72',    // Placeholder text (more visible)
  disabled: '#4A4B52',       // Disabled state color
  
  // Overlay and modal colors
  overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlay
  modalBackground: '#1A1B22',     // Modal background
  
  // Special effects
  glow: 'rgba(111, 175, 225, 0.3)', // Primary color glow effect
  shadow: 'rgba(0, 0, 0, 0.4)',     // Dark shadow for depth
} as const;

export type ColorScheme = typeof colors;
