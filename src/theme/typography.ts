// Typography system for Antiplanet
// Uses Noto Sans JP with multiple weights for consistent typography

export const typography = {
  heading: {
    fontFamily: 'NotoSansJP_700Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  subheading: {
    fontFamily: 'NotoSansJP_500Medium',
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'NotoSansJP_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'NotoSansJP_300Light',
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: 'NotoSansJP_300Light',
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: 'NotoSansJP_500Medium',
    fontSize: 16,
    lineHeight: 24,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
