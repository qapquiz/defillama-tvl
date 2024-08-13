export function batch<T>(items: T[], batchSize = 50): T[][] {
	if (items.length <= batchSize) {
		return [items];
	}

	const some = items.slice(0, batchSize);
	const rest = items.slice(batchSize, items.length);

	return [some, ...batch(rest, batchSize)];
}
