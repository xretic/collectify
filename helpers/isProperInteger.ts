export function isProperInteger(value: number): boolean {
    return Number.isInteger(value) && value <= 2147483647 && value >= 1;
}
