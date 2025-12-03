import { Colors } from '@/constants/Theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName:
    | 'text'
    | 'background'
    | 'tint'
    | 'icon'
    | 'tabIconDefault'
    | 'tabIconSelected'
) {
  // If a specific color is provided in props, use it (ignoring theme for now as we are dark-first)
  if (props.dark) {
    return props.dark;
  }
  if (props.light) {
    return props.light;
  }

  // Fallback to our Theme system
  // We map the standard Expo template color names to our Theme.ts values
  switch (colorName) {
    case 'text':
      return Colors.white;
    case 'background':
      return Colors.grok.background;
    case 'tint':
      return Colors.primary[500];
    case 'icon':
      return Colors.gray[400];
    case 'tabIconDefault':
      return Colors.gray[500];
    case 'tabIconSelected':
      return Colors.white;
    default:
      return Colors.white;
  }
}
