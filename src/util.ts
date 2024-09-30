export function formatValue(value: bigint): string {
	const divisor = 10n ** 18n;
	const integerPart = value / divisor;
	const fractionalPart = value % divisor;
	const fractionalString = fractionalPart.toString().padStart(18, '0').replace(/0+$/, '');

	return fractionalString ? `${integerPart}.${fractionalString}` : `${integerPart}`;
}
