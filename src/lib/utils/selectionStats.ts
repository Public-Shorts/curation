type Film = {
	_id: string;
	length?: number;
	isVisible?: boolean;
	[key: string]: any;
};

export function calculateSectionStats(films: Film[]) {
	const totalMinutes = films.reduce((sum, f) => sum + (f.length || 0), 0);
	const visibleFilms = films.filter((f) => f.isVisible);
	const visibleCount = visibleFilms.length;
	const visibleMinutes = visibleFilms.reduce((sum, f) => sum + (f.length || 0), 0);

	return {
		totalCount: films.length,
		totalMinutes,
		visibleCount,
		visibleMinutes
	};
}

export function addVisibilityToFilms<T extends Film>(
	films: T[],
	filterFn: (film: T) => boolean
): (T & { isVisible: boolean })[] {
	return films.map((f) => ({ ...f, isVisible: filterFn(f) }));
}
