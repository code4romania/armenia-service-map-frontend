export const partnerLogos = {
  hy: [
    { src: '/am-partner-logos/1-ddf.png', alt: 'Democracy Development Foundation', width: 1390, height: 256 },
    { src: '/am-partner-logos/2-erc.png', alt: 'Estonian Refugee Council', width: 3855, height: 741 },
    { src: '/am-partner-logos/3-commit.png', alt: 'Commit Global', width: 3605, height: 1039 },
    { src: '/am-partner-logos/4-csvw.png', alt: 'Coalition to Stop Violence Against Women', width: 478, height: 175 },
  ],
  en: [
    { src: '/en-partner-logos/1-ddf.svg', alt: 'Democracy Development Foundation', width: 1100, height: 262 },
    { src: '/en-partner-logos/2-erc.png', alt: 'Estonian Refugee Council', width: 3855, height: 741 },
    { src: '/en-partner-logos/3-commit.png', alt: 'Commit Global', width: 3605, height: 1039 },
    { src: '/en-partner-logos/4-csvw.png', alt: 'Coalition to Stop Violence Against Women', width: 478, height: 175 },
  ],
} as const;

export const euFundedLogo = {
  hy: { src: '/eu-funded-arm.png', alt: 'Ֆինանսավորվում է Եվրոպական միության կողմից', width: 5834, height: 888 },
  en: { src: '/eu-funded-en.png', alt: 'Funded by the European Union', width: 4096, height: 913 },
} as const;

export function getLogoLocale(locale: string) {
  return locale === 'hy' ? 'hy' : 'en';
}
