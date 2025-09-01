export function tokenize(text: string): string[] {
  const camelCaseSecondaryWords = [...text.matchAll(/(?<=[a-z])[A-Z]\w+/g)].map(
    (x) => x[0].toLowerCase(),
  );

  const primary = [...text.matchAll(/([a-z]+|[0-9]+|\B[#]\B)/gi)].map((x) =>
    x[0].toLowerCase(),
  );

  const leadingZeros = (input: string) => {
    const match = input.match(/^0+(.+)/);
    return match ? [input, match[1]] : [input];
  };

  return [...camelCaseSecondaryWords, ...primary].flatMap(leadingZeros);
}
