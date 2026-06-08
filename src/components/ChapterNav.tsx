import { useCallback } from "preact/hooks";

interface ChapterNavProps {
	bookNumber: number;
	chapter: number;
	chapterCount: number;
	bookCount: number;
	onNavigate: (bookNumber: number, chapter: number) => void;
}

export function ChapterNav({
	bookNumber,
	chapter,
	chapterCount,
	bookCount,
	onNavigate,
}: ChapterNavProps) {
	const canGoPrev = chapter > 1 || bookNumber > 1;
	const canGoNext = chapter < chapterCount || bookNumber < bookCount;

	const handlePrev = useCallback(() => {
		if (chapter > 1) {
			onNavigate(bookNumber, chapter - 1);
		} else if (bookNumber > 1) {
			onNavigate(bookNumber - 1, 1);
		}
	}, [bookNumber, chapter, onNavigate]);

	const handleNext = useCallback(() => {
		if (chapter < chapterCount) {
			onNavigate(bookNumber, chapter + 1);
		} else if (bookNumber < bookCount) {
			onNavigate(bookNumber + 1, 1);
		}
	}, [bookNumber, chapter, chapterCount, bookCount, onNavigate]);

	return (
		<div class="chapter-nav">
			<button
				class="chapter-nav-btn"
				onClick={handlePrev}
				disabled={!canGoPrev}
				type="button"
			>
				← Prev
			</button>
			<button
				class="chapter-nav-btn"
				onClick={handleNext}
				disabled={!canGoNext}
				type="button"
			>
				Next →
			</button>
		</div>
	);
}
