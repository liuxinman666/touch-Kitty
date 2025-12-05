import { TypewriterRule } from '../types';

// Refined "Cartoon" Cat Pattern
// We use specific characters to help the renderer apply colors later:
// ^ : Ears
// O : Eyes
// w : Mouth/Nose area
// = : Whiskers
// # : Fur/Body
// ( ) / \ : Outlines
export const catRules: TypewriterRule[] = [
  // Ears
  ["1", "8sp 1/ 1\\ 13sp 1/ 1\\"],
  ["2", "7sp 1/ 2# 1\\ 11sp 1/ 2# 1\\"],
  ["3", "6sp 1/ 4# 1\\ 9sp 1/ 4# 1\\"],
  
  // Top Head
  ["4", "5sp 1/ 30# 1\\"],
  ["5", "4sp 1/ 32# 1\\"],
  
  // Eyes & Forehead
  ["6", "3sp 1| 6# 1( 3_ 1) 12# 1( 3_ 1) 6# 1|"],
  ["7", "3sp 1| 6# 1| 1sp 1O 1sp 1| 12# 1| 1sp 1O 1sp 1| 6# 1|"],
  
  // Cheeks & Nose
  ["8", "3sp 1| 4= 2# 1\\ 3_ 1/ 4# 1. 1. 4# 1\\ 3_ 1/ 2# 4= 1|"],
  
  // Mouth
  ["9", "4sp 1\\ 36# 1/"],
  ["10", "5sp 1\\ 15# 1w 1w 15# 1/"],
  
  // Chin/Body
  ["11", "6sp 1\\ 30# 1/"],
  ["12", "7sp 1\\ 28# 1/"],
  ["13", "8sp 1( 26# 1)"],
  ["14", "9sp 1( 24sp 1)"]
];

export const parseRowInstructions = (instructions: string): string => {
  const tokens = instructions.split(' ');
  let rowStr = '';
  for (const token of tokens) {
    let count = 1;
    let symbol = '';
    const match = token.match(/^(\d+)(.+)/);
    if (match) {
      count = parseInt(match[1], 10);
      symbol = match[2];
    } else {
      symbol = token;
    }
    
    if (symbol === 'sp') symbol = ' ';
    // No replacement for 'b' needed in this set, but keeping logic clean
    
    rowStr += symbol.repeat(count);
  }
  return rowStr;
};