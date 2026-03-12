'use strict';

/**
 * Theme definitions for Flxify TUI.
 *
 * All hex values are extracted directly from style.css CSS custom properties.
 * Property name mapping:
 *   --bg-primary        → bgPrimary
 *   --bg-secondary      → bgSecondary
 *   --bg-editor         → bgEditor
 *   --palette-bg        → bgPalette
 *   --palette-item-hover → bgPaletteHover
 *   --palette-selected  → bgSelected
 *   --status-bg         → bgStatusBar
 *   --text-primary      → textPrimary
 *   --text-secondary    → textSecondary
 *   --text-muted        → textMuted
 *   --text-link         → textAccent
 *   --editor-cursor     → editorCursor
 *   --palette-selected  → editorSelection (solid color approximation)
 *   --gutter-text       → gutterText
 *   --text-primary      → gutterActiveText (full brightness on active line)
 *   --color-error       → colorError
 *   --color-info        → colorInfo
 *   --color-success     → colorSuccess
 *   --accent            → accent
 *   --border-color      → border
 *   --palette-input-bg  → paletteInputBg
 *   --text-primary      → paletteInputText
 *   --text-primary      → paletteItemText
 *   --text-secondary    → paletteItemDesc
 *   btn-text            → paletteSelectedText
 *   --text-secondary    → paletteSelectedDesc
 */

module.exports = {
  'standard-light': {
    bgPrimary:          '#fafafa',
    bgSecondary:        '#f5f5f5',
    bgEditor:           '#ffffff',
    bgPalette:          '#ffffff',
    bgPaletteHover:     '#ebebeb',
    bgSelected:         '#0066cc',
    bgStatusBar:        '#f0f0f0',
    textPrimary:        '#1e1e1e',
    textSecondary:      '#555555',
    textMuted:          '#888888',
    textAccent:         '#0066cc',
    editorCursor:       '#1e1e1e',
    editorSelection:    '#0066cc',
    gutterText:         '#b0b0b0',
    gutterActiveText:   '#1e1e1e',
    colorError:         '#c0392b',
    colorInfo:          '#2980b9',
    colorSuccess:       '#1a7f37',
    accent:             '#0066cc',
    border:             '#e0e0e0',
    paletteInputBg:     '#fafafa',
    paletteInputText:   '#1e1e1e',
    paletteItemText:    '#1e1e1e',
    paletteItemDesc:    '#555555',
    paletteSelectedText: '#ffffff',
    paletteSelectedDesc: '#e0e0e0'
  },

  'standard-dark': {
    bgPrimary:          '#181818',
    bgSecondary:        '#252526',
    bgEditor:           '#1e1e1e',
    bgPalette:          '#252526',
    bgPaletteHover:     '#2a2d2e',
    bgSelected:         '#094771',
    bgStatusBar:        '#21252b',
    textPrimary:        '#d4d4d4',
    textSecondary:      '#888888',
    textMuted:          '#666666',
    textAccent:         '#4da6ff',
    editorCursor:       '#aeafad',
    editorSelection:    '#094771',
    gutterText:         '#4a4a4a',
    gutterActiveText:   '#c6c6c6',
    colorError:         '#f14c4c',
    colorInfo:          '#3b9de8',
    colorSuccess:       '#4ec94e',
    accent:             '#094771',
    border:             '#333333',
    paletteInputBg:     '#2d2d2d',
    paletteInputText:   '#d4d4d4',
    paletteItemText:    '#d4d4d4',
    paletteItemDesc:    '#888888',
    paletteSelectedText: '#ffffff',
    paletteSelectedDesc: '#cccccc'
  },

  'cyber-neon': {
    bgPrimary:          '#0d0d1a',
    bgSecondary:        '#12121f',
    bgEditor:           '#0a0a14',
    bgPalette:          '#12121f',
    bgPaletteHover:     '#1a1a2e',
    bgSelected:         '#00f5ff',
    bgStatusBar:        '#0a0a14',
    textPrimary:        '#e8e8ff',
    textSecondary:      '#8888cc',
    textMuted:          '#4a4a7a',
    textAccent:         '#00f5ff',
    editorCursor:       '#00f5ff',
    editorSelection:    '#00f5ff',
    gutterText:         '#2a2a4a',
    gutterActiveText:   '#e8e8ff',
    colorError:         '#ff2d95',
    colorInfo:          '#00f5ff',
    colorSuccess:       '#39ff14',
    accent:             '#00f5ff',
    border:             '#1e1e3a',
    paletteInputBg:     '#0d0d1a',
    paletteInputText:   '#e8e8ff',
    paletteItemText:    '#e8e8ff',
    paletteItemDesc:    '#8888cc',
    paletteSelectedText: '#0a0a14',
    paletteSelectedDesc: '#0d0d1a'
  },

  'nordic-frost': {
    bgPrimary:          '#242933',
    bgSecondary:        '#2e3440',
    bgEditor:           '#2e3440',
    bgPalette:          '#2e3440',
    bgPaletteHover:     '#3b4252',
    bgSelected:         '#5e81ac',
    bgStatusBar:        '#242933',
    textPrimary:        '#eceff4',
    textSecondary:      '#adb8cc',
    textMuted:          '#6b7a96',
    textAccent:         '#88c0d0',
    editorCursor:       '#d8dee9',
    editorSelection:    '#5e81ac',
    gutterText:         '#4c566a',
    gutterActiveText:   '#eceff4',
    colorError:         '#bf616a',
    colorInfo:          '#88c0d0',
    colorSuccess:       '#a3be8c',
    accent:             '#5e81ac',
    border:             '#434c5e',
    paletteInputBg:     '#242933',
    paletteInputText:   '#eceff4',
    paletteItemText:    '#eceff4',
    paletteItemDesc:    '#adb8cc',
    paletteSelectedText: '#eceff4',
    paletteSelectedDesc: '#adb8cc'
  },

  'monokai-pro': {
    bgPrimary:          '#221f22',
    bgSecondary:        '#2d2a2e',
    bgEditor:           '#2d2a2e',
    bgPalette:          '#2d2a2e',
    bgPaletteHover:     '#3a3738',
    bgSelected:         '#403e41',
    bgStatusBar:        '#221f22',
    textPrimary:        '#fcfcfa',
    textSecondary:      '#939293',
    textMuted:          '#5b595c',
    textAccent:         '#78dce8',
    editorCursor:       '#fcfcfa',
    editorSelection:    '#403e41',
    gutterText:         '#5b595c',
    gutterActiveText:   '#fcfcfa',
    colorError:         '#ff6188',
    colorInfo:          '#78dce8',
    colorSuccess:       '#a9dc76',
    accent:             '#ab9df2',
    border:             '#403e41',
    paletteInputBg:     '#221f22',
    paletteInputText:   '#fcfcfa',
    paletteItemText:    '#fcfcfa',
    paletteItemDesc:    '#939293',
    paletteSelectedText: '#fcfcfa',
    paletteSelectedDesc: '#939293'
  },

  'oled-stealth': {
    bgPrimary:          '#000000',
    bgSecondary:        '#0d0d0d',
    bgEditor:           '#000000',
    bgPalette:          '#0d0d0d',
    bgPaletteHover:     '#111111',
    bgSelected:         '#0066ff',
    bgStatusBar:        '#0a0a0a',
    textPrimary:        '#e8e8e8',
    textSecondary:      '#707070',
    textMuted:          '#3d3d3d',
    textAccent:         '#0066ff',
    editorCursor:       '#0066ff',
    editorSelection:    '#0066ff',
    gutterText:         '#222222',
    gutterActiveText:   '#e8e8e8',
    colorError:         '#ff3333',
    colorInfo:          '#0066ff',
    colorSuccess:       '#00cc66',
    accent:             '#0066ff',
    border:             '#1a1a1a',
    paletteInputBg:     '#000000',
    paletteInputText:   '#e8e8e8',
    paletteItemText:    '#e8e8e8',
    paletteItemDesc:    '#707070',
    paletteSelectedText: '#ffffff',
    paletteSelectedDesc: '#e8e8e8'
  }
};
