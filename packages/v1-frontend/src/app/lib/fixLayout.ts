const En = "qwertyuiop[]asdfghjkl;'zxcvbnm,.",
  Ru = 'йцукенгшщзхъфывапролджэячсмитьбю';

const ruEnMap: Record<string, string> = [...Ru].reduce<Record<string, string>>(
  (acc, ruChar, index) => {
    const enChar = En[index];

    if (enChar) {
      acc[ruChar] = enChar;
      acc[ruChar.toUpperCase()] = enChar.toUpperCase();
    }

    return acc;
  },
  {},
);

export function isRuLayout(text: string) {
  return [...text].some((c) => Ru.includes(c));
}

export function fixRuLayout(text: string) {
  return [...text].map((c) => ruEnMap[c] || c).join('');
}
