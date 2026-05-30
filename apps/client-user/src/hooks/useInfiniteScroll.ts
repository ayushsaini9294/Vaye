import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

/**
 * Generic infinite-scroll hook.
 * - Fetches the first page immediately on mount.
 * - Attaches an IntersectionObserver to a sentinel element; when it enters
 *   view the next page is loaded and appended.
 * - Preserves scroll position across navigations via sessionStorage.
 */
export function useInfiniteScroll<T>(
	fetchPage: (offset: number, limit: number) => Promise<T[]>,
	key: string, // unique key per feed for scroll-position storage
) {
	const [items, setItems] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const offsetRef = useRef(0);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Load one page and append
	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore) return;
		setLoadingMore(true);
		try {
			const page = await fetchPage(offsetRef.current, PAGE_SIZE);
			setItems((prev) => {
				const combined = [...prev, ...page];
				return combined;
			});
			offsetRef.current += page.length;
			if (page.length < PAGE_SIZE) setHasMore(false);
		} catch (err) {
			console.error("Infinite scroll fetch error:", err);
		} finally {
			setLoadingMore(false);
		}
	}, [fetchPage, loadingMore, hasMore]);

	// Initial load
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setItems([]);
		offsetRef.current = 0;
		setHasMore(true);

		fetchPage(0, PAGE_SIZE)
			.then((page) => {
				if (cancelled) return;
				setItems(page);
				offsetRef.current = page.length;
				if (page.length < PAGE_SIZE) setHasMore(false);
			})
			.catch(console.error)
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	// IntersectionObserver on sentinel
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		observerRef.current?.disconnect();
		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			},
			{ rootMargin: "200px" },
		);
		observerRef.current.observe(sentinel);

		return () => observerRef.current?.disconnect();
	}, [loadMore]);

	// Scroll-position preservation
	const scrollKey = `scroll:${key}`;

	const saveScroll = useCallback(() => {
		sessionStorage.setItem(scrollKey, String(window.scrollY));
	}, [scrollKey]);

	useEffect(() => {
		if (loading) return;
		const saved = sessionStorage.getItem(scrollKey);
		if (saved && Number(saved) > 0) {
			requestAnimationFrame(() => {
				window.scrollTo({ top: Number(saved), behavior: "instant" });
			});
		}
	}, [loading, scrollKey]);

	// Save scroll position throttled
	useEffect(() => {
		let timeoutId: number;
		const handleScroll = () => {
			if (timeoutId) return;
			timeoutId = window.setTimeout(() => {
				sessionStorage.setItem(scrollKey, String(window.scrollY));
				timeoutId = 0;
			}, 100);
		};
		
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [scrollKey]);

	return { items, loading, loadingMore, hasMore, sentinelRef, saveScroll };
}
