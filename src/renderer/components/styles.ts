import React from 'react';

// CSS properties with WebKit extensions
export interface WebkitCSSProperties extends React.CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag';
  WebkitUserSelect?: 'none' | 'text' | 'all';
  userSelect?: 'none' | 'text' | 'all';
}

// Custom scrollbar styles
export const scrollbarStyles = {
  // Main scrollbar container
  '&::WebkitScrollbar': {
    width: '8px',
    backgroundColor: 'rgba(31, 41, 55, 0.5)'
  },
  // Scrollbar handle/thumb
  '&::WebkitScrollbarThumb': {
    backgroundColor: 'rgba(59, 130, 246, 0.7)',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.9)'
    }
  },
  // Scrollbar track/background
  '&::WebkitScrollbarTrack': {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: '4px'
  }
} as React.CSSProperties;

// Non-selectable style
export const nonSelectableStyle = {
  WebkitUserSelect: 'none',
  userSelect: 'none',
} as React.CSSProperties;

// Selectable style
export const selectableStyle = {
  WebkitUserSelect: 'text',
  userSelect: 'text',
} as React.CSSProperties; 