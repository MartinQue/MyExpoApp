/**
 * Grok-inspired color palette
 * Extracted from grok-clone repository CSS variables
 */

export const GrokColors = {
  dark: {
    // Core backgrounds
    background: '#000000',      // --background: 0, 0, 0
    foreground: '#898B8E',      // --foreground: 137, 139, 142
    card: '#0D0F10',           // --card: 13, 15, 16
    cardForeground: '#898B8E',  // --card-foreground: 137, 139, 142

    // Input elements
    input: '#212327',          // --input: 33, 35, 39
    inputText: '#747474',      // Placeholder text color
    inputBorder: '#2A2C30',    // Subtle border

    // Popover/Modal
    popover: '#0D0F10',        // --popover: 13, 15, 16
    popoverForeground: '#898B8E', // --popover-foreground: 137, 139, 142

    // Accent colors
    primary: '#FFFFFF',        // Primary text/icons
    secondary: '#747474',      // Secondary text
    muted: '#898B8E',         // Muted text

    // Message bubbles
    userBubble: '#212327',     // User message background
    assistantBubble: '#0D0F10', // Assistant message background

    // Interactive elements
    hover: '#1A1C20',         // Hover state
    active: '#2A2C30',        // Active/pressed state
    border: '#2A2C30',        // Border color

    // Status colors
    success: '#10B981',       // Success/positive
    error: '#EF4444',         // Error/negative
    warning: '#F59E0B',       // Warning
  },

  light: {
    // Light mode (for future implementation)
    background: '#FFFFFF',
    foreground: '#000000',
    card: '#F9FAFB',
    cardForeground: '#000000',
    input: '#F3F4F6',
    inputText: '#6B7280',
    inputBorder: '#E5E7EB',
    popover: '#FFFFFF',
    popoverForeground: '#000000',
    primary: '#000000',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    userBubble: '#F3F4F6',
    assistantBubble: '#FFFFFF',
    hover: '#F9FAFB',
    active: '#F3F4F6',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

// Current theme - easily switch between dark/light
export const colors = GrokColors.dark;
