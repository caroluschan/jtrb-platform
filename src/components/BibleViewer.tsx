import { useCallback, useRef, useState } from "preact/hooks";
import { useBible } from "../hooks/useBible";
import { useDatabase } from "../hooks/useDatabase";
import { useScrollSync } from "../hooks/useScrollSync";
import { useVerseAlign } from "../hooks/useVerseAlign";
import { BiblePanel } from "./BiblePanel";
import { BookChapterNav } from "./BookChapterNav";
import { ChapterNav } from "./ChapterNav";
import { SettingsPopup } from "./SettingsPopup";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";

export function BibleViewer() {
	const { state: dbState, dbs, error: dbError } = useDatabase();
	const [bookNumber, setBookNumber] = useState<number | null>(null);
	const [chapter, setChapter] = useState<number | null>(null);

	const {
		books,
		chapterCount: chapterCountBible,
		verses,
		loading: bibleLoading,
		error: bibleError,
	} = useBible(dbs?.rcuv ?? null, dbs?.jss ?? null, bookNumber, chapter);

	const leftPanelRef = useRef<HTMLDivElement>(null);
	const rightPanelRef = useRef<HTMLDivElement>(null);
	const { settings, setFontSize, setArrangement } = useSettings();
	const { theme, setTheme } = useTheme();
	const panelsReady = dbState === "ready" && !bibleLoading && verses.length > 0;

	useVerseAlign({
		leftRef: leftPanelRef,
		rightRef: rightPanelRef,
		enabled: settings.arrangement === 'aligned' && panelsReady,
		versesKey: verses,
		fontSizeKey: settings.fontSize,
	});

	useScrollSync(leftPanelRef, rightPanelRef, panelsReady && settings.arrangement === 'aligned');

	const handleNavigate = useCallback((book: number, ch: number) => {
		setBookNumber(book);
		setChapter(ch);
		try {
			localStorage.setItem('jvc-last-book', String(book));
			localStorage.setItem('jvc-last-chapter', String(ch));
		} catch {
			// localStorage unavailable
		}
	}, []);

	if (dbState === "loading") {
		return (
			<div class="loading-container">
				<div class="spinner" />
				<div class="loading-text">Loading Bible databases...</div>
			</div>
		);
	}

	if (dbState === "error") {
		return (
			<div class="error-container">
				<div class="error-icon">⚠️</div>
				<div class="error-message">
					{dbError ?? "Failed to load Bible data"}
				</div>
				<button
					type="button"
					class="error-retry"
					onClick={() => window.location.reload()}
				>
					Retry
				</button>
			</div>
		);
	}

	if (!dbs) return null;

	return (
		<div class="bible-viewer">
			<header class="header">
				<BookChapterNav
					rcuvDb={dbs.rcuv}
					jssDb={dbs.jss}
					bookNumber={bookNumber}
					chapter={chapter}
					chapterCount={chapterCountBible}
					onNavigate={handleNavigate}
				/>
				<SettingsPopup theme={theme} setTheme={setTheme} settings={settings} setFontSize={setFontSize} setArrangement={setArrangement} />
			</header>
			<div class="panels">
				{bibleLoading ? (
					<>
						<div class="panel">
							<div class="loading-container">
								<div class="spinner" />
								<div class="loading-text">Loading verses...</div>
							</div>
						</div>
						<div class="panel">
							<div class="loading-container">
								<div class="spinner" />
								<div class="loading-text">Loading verses...</div>
							</div>
						</div>
					</>
				) : bibleError ? (
					<div class="error-container">
						<div class="error-message">{bibleError}</div>
					</div>
				) : (
					<>
						<BiblePanel ref={leftPanelRef} lang="jss" verses={verses} arrangement={settings.arrangement} />
						<BiblePanel ref={rightPanelRef} lang="rcuv" verses={verses} arrangement={settings.arrangement} />
					</>
				)}
			</div>
			{bookNumber !== null && chapter !== null && (
				<ChapterNav
					bookNumber={bookNumber}
					chapter={chapter}
					chapterCount={chapterCountBible}
					bookCount={books.length}
					onNavigate={handleNavigate}
				/>
			)}
		</div>
	);
}
