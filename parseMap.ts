const parseMapStr = (str: string, charMap: Record<string, number>): number[][] => {
  const lines = str.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.map(line => line.split('').map(c => charMap[c] ?? 0));
};
