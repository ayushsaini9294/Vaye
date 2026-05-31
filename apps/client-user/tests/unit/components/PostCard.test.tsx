import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostCard } from "../../../src/components/posts/PostCard";

// Mock the server functions
vi.mock("../../../src/server/functions/likes", () => ({
	togglePostLike: vi.fn(),
}));

vi.mock("../../../src/server/functions/posts", () => ({
	deletePost: vi.fn(),
}));

vi.mock("../../../src/server/functions/bookmarks", () => ({
	toggleBookmark: vi.fn(),
	getBookmarkStatus: vi.fn().mockResolvedValue({ bookmarked: false }),
}));

// Mock TanStack Router Link component
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => vi.fn(),
}));

const mockPost = {
	id: "post1",
	content: "Test post content",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T10:00:00Z"),
	author: {
		id: "user1",
		username: "testuser",
		displayName: "Test User",
		avatarUrl: null,
	},
	likeCount: 5,
	commentCount: 3,
};

describe("PostCard", () => {
	it("renders post content correctly", () => {
		render(<PostCard post={mockPost} />);
		expect(screen.getByText("Test post content")).toBeInTheDocument();
		expect(screen.getByText("Test User")).toBeInTheDocument();
		expect(screen.getByText("@testuser")).toBeInTheDocument();
	});

	it("displays like and comment counts", () => {
		render(<PostCard post={mockPost} />);
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
	});

	it("shows delete button for own posts", () => {
		render(<PostCard post={mockPost} currentUserId="user1" />);
		const deleteBtn = screen.getByTitle("Delete post");
		expect(deleteBtn).toBeInTheDocument();
	});

	it("shows edited indicator when post is edited", () => {
		const editedPost = {
			...mockPost,
			updatedAt: new Date("2024-01-01T11:00:00Z"),
		};
		render(<PostCard post={editedPost} />);
		expect(screen.getByText("edited")).toBeInTheDocument();
	});
});
