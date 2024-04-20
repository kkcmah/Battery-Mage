// get random between min and max
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export const getRandomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}
