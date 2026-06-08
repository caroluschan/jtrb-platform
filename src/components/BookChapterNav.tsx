import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "preact/hooks";
import type { Database } from "sql.js";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Book } from "../types";
import { getBooks, getMaxChapter } from "../utils/bible";

interface BookChapterNavProps {
	rcuvDb: Database | null;
	jssDb: Database | null;
	bookNumber: number | null;
	chapter: number | null;
	chapterCount: number;
	onNavigate: (bookNumber: number, chapter: number) => void;
}

export function BookChapterNav({
	rcuvDb,
	jssDb,
	bookNumber,
	chapter,
	onNavigate,
}: BookChapterNavProps) {
	const [savedBook, setSavedBook] = useLocalStorage<number>(
		"jvc-last-book",
		1,
	);
	const [savedChapter, setSavedChapter] = useLocalStorage<number>(
		"jvc-last-chapter",
		1,
	);

	// Modal state
	const [isOpen, setIsOpen] = useState(false);
	const [mode, setMode] = useState<"book" | "chapter">("book");
	const [filterText, setFilterText] = useState("");
	const [pendingBook, setPendingBook] = useState<number | null>(null);
	const filterRef = useRef<HTMLInputElement>(null);

	// Build merged book list: pair RCUV and JSS names
	const books = useMemo(() => {
		if (!rcuvDb || !jssDb) return [] as (Book & { jssName: string })[];
		const rcuvBooks = getBooks(rcuvDb);
		const jssBooks = getBooks(jssDb);
		const jssMap = new Map(jssBooks.map((b) => [b.book_number, b.long_name]));
		return rcuvBooks.flatMap((b) => {
			const jssName = jssMap.get(b.book_number);
			return jssName ? [{ ...b, jssName }] : [];
		});
	}, [rcuvDb, jssDb]);

	// Navigate on mount (restore saved position)
	useEffect(() => {
		if (savedBook && savedChapter) {
			onNavigate(savedBook, savedChapter);
		}
		// Only run on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Auto-focus filter input when modal opens in book mode
	useEffect(() => {
		if (isOpen && mode === "book" && filterRef.current) {
			// Small delay so the input is in the DOM
			const timer = setTimeout(() => filterRef.current?.focus(), 50);
			return () => clearTimeout(timer);
		}
	}, [isOpen, mode]);

	// Close on Escape key
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closePanel();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	// Chapter count for the pending book (modal chapter grid)
	const [pendingChapterCount, setPendingChapterCount] = useState(0);
	useEffect(() => {
		if (!rcuvDb || pendingBook === null) {
			setPendingChapterCount(0);
			return;
		}
		try {
			const count = getMaxChapter(rcuvDb, pendingBook);
			setPendingChapterCount(count);
		} catch {
			setPendingChapterCount(0);
		}
	}, [rcuvDb, pendingBook]);

	// Filter books by typed text
	const filteredBooks = useMemo(() => {
		if (!filterText.trim()) return books;
		const lower = filterText.toLowerCase();
		return books.filter(
			(b) =>
				b.long_name.toLowerCase().includes(lower) ||
				b.jssName.toLowerCase().includes(lower) ||
				b.short_name.toLowerCase().includes(lower),
		);
	}, [books, filterText]);

	// Current book display name
	const currentBookName = useMemo(() => {
		if (bookNumber === null || !books.length) return "";
		const book = books.find((b) => b.book_number === bookNumber);
		return book ? book.long_name : "";
	}, [books, bookNumber]);

	const displayText =
		bookNumber !== null && chapter !== null
			? `${currentBookName} ${chapter}`
			: "Select...";

	const openPanel = useCallback(() => {
		setMode("book");
		setFilterText("");
		setPendingBook(null);
		setIsOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setIsOpen(false);
		setFilterText("");
		setPendingBook(null);
	}, []);

	const handleBookSelect = useCallback((bookNum: number) => {
		setPendingBook(bookNum);
		setMode("chapter");
		setFilterText("");
	}, []);

	const handleChapterSelect = useCallback(
		(ch: number) => {
			if (pendingBook === null) return;
			onNavigate(pendingBook, ch);
			setSavedBook(pendingBook);
			setSavedChapter(ch);
			closePanel();
		},
		[pendingBook, onNavigate, setSavedBook, setSavedChapter, closePanel],
	);

	const handleBackToBook = useCallback(() => {
		setMode("book");
		setPendingBook(null);
		setFilterText("");
	}, []);

	const handleOverlayClick = useCallback(
		(e: MouseEvent) => {
			if (e.target === e.currentTarget) closePanel();
		},
		[closePanel],
	);

	const handleOverlayKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				closePanel();
			}
		},
		[closePanel],
	);

	// Generate chapter grid buttons
	const chapterGrid = useMemo(() => {
		const items = [];
		for (let i = 1; i <= pendingChapterCount; i++) {
			const isCurrent = pendingBook === bookNumber && i === chapter;
			items.push(
				<button
					key={i}
					class={`nav-chapter-item${isCurrent ? " current" : ""}`}
					onClick={() => handleChapterSelect(i)}
					type="button"
				>
					{i}
				</button>,
			);
		}
		return items;
	}, [
		pendingChapterCount,
		pendingBook,
		bookNumber,
		chapter,
		handleChapterSelect,
	]);

	return (
		<div class="nav-group">
			<button class="nav-trigger" onClick={openPanel} type="button">
				{displayText}
				<span class="nav-trigger-chevron">▾</span>
			</button>

			{isOpen && (
				<button
					class="nav-overlay"
					onClick={handleOverlayClick}
					onKeyDown={handleOverlayKeyDown}
					type="button"
					aria-label="Close navigation"
				>
					<div class="nav-panel">
						{/* ── Book Selection Mode ── */}
						{mode === "book" && (
							<>
								<div class="nav-panel-header">
									<span class="nav-label">BOOK</span>
									<button
										class="nav-panel-close"
										onClick={closePanel}
										type="button"
									>
										Cancel
									</button>
								</div>
								<div class="nav-filter">
									<input
										ref={filterRef}
										type="text"
										placeholder="Filter Books..."
										value={filterText}
										onInput={(e) =>
											setFilterText((e.target as HTMLInputElement).value)
										}
									/>
								</div>
								<div class="nav-book-list">
									{filteredBooks.length === 0 ? (
										<div class="nav-empty">No books found</div>
									) : (
										filteredBooks.map((book) => {
											const isSelected = book.book_number === bookNumber;
											return (
												<button
													key={book.book_number}
													class={`nav-book-item${isSelected ? " selected" : ""}`}
													onClick={() => handleBookSelect(book.book_number)}
													type="button"
												>
													{book.long_name} {book.jssName}
												</button>
											);
										})
									)}
								</div>
							</>
						)}

						{/* ── Chapter Selection Mode ── */}
						{mode === "chapter" && (
							<>
								<div class="nav-panel-header">
									<button
										class="nav-panel-back"
										onClick={handleBackToBook}
										type="button"
									>
										← Back
									</button>
									<span class="nav-label">CHAPTER</span>
									<button
										class="nav-panel-close"
										onClick={closePanel}
										type="button"
									>
										Cancel
									</button>
								</div>
								<div class="nav-chapter-grid">
									{pendingChapterCount === 0 ? (
										<div class="nav-empty">Loading chapters...</div>
									) : (
										chapterGrid
									)}
								</div>
							</>
						)}
					</div>
				</button>
			)}
		</div>
	);
}
