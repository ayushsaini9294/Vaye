import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage, markAsRead } from "../../server/functions/chat";
import { getUser } from "../../server/functions/users";
import { getCurrentUser } from "../../server/functions/auth";
import { UserAvatar } from "../../components/users/UserAvatar";
import * as stylex from "@stylexjs/stylex";
import { colors, spacing, fontSize, fontWeight } from "../../tokens.stylex";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/messages/$username")({
	component: ChatView,
});

const slideUp = stylex.keyframes({
	from: { opacity: 0, transform: "translateY(8px)" },
	to: { opacity: 1, transform: "translateY(0)" },
});

const styles = stylex.create({
	container: {
		display: "flex",
		flexDirection: "column",
		height: "100%",
	},
	header: {
		display: "flex",
		alignItems: "center",
		padding: `${spacing.md} ${spacing.lg}`,
		borderBottom: `1px solid ${colors.gray800}`,
		gap: spacing.md,
		backgroundColor: "rgba(15, 23, 42, 0.6)",
		backdropFilter: "blur(16px)",
		position: "sticky" as any,
		top: 0,
		zIndex: 10,
	},
	backButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "36px",
		height: "36px",
		borderRadius: "10px",
		border: "none",
		backgroundColor: "transparent",
		color: colors.gray400,
		cursor: "pointer",
		transition: "all 0.2s ease",
		textDecoration: "none",
		":hover": {
			backgroundColor: "rgba(99, 102, 241, 0.1)",
			color: colors.indigo400,
		},
		"@media (min-width: 768px)": {
			display: "none",
		},
	},
	headerInfo: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		textDecoration: "none",
		color: "inherit",
		flex: 1,
		borderRadius: "10px",
		padding: spacing.xs,
		transition: "background-color 0.2s ease",
		":hover": {
			backgroundColor: "rgba(255, 255, 255, 0.03)",
		},
	},
	headerText: {
		display: "flex",
		flexDirection: "column",
	},
	displayName: {
		fontWeight: fontWeight.bold,
		fontSize: fontSize.base,
		color: colors.white,
		lineHeight: "1.2",
	},
	username: {
		color: colors.gray500,
		fontSize: fontSize.sm,
	},
	onlineStatus: {
		display: "flex",
		alignItems: "center",
		gap: "4px",
		fontSize: "0.75rem",
		color: colors.green500,
	},
	onlineDot: {
		width: "6px",
		height: "6px",
		borderRadius: "50%",
		backgroundColor: colors.green500,
	},
	messagesArea: {
		flex: 1,
		overflowY: "auto",
		padding: `${spacing.md} ${spacing.lg}`,
		display: "flex",
		flexDirection: "column",
		gap: "2px",
	},
	dateGroup: {
		display: "flex",
		justifyContent: "center",
		padding: `${spacing.md} 0`,
	},
	dateBadge: {
		fontSize: "0.75rem",
		color: colors.gray500,
		backgroundColor: "rgba(30, 41, 59, 0.8)",
		padding: "4px 12px",
		borderRadius: "12px",
		fontWeight: fontWeight.medium,
	},
	messageWrapper: {
		display: "flex",
		flexDirection: "column",
		maxWidth: "75%",
		animationName: slideUp,
		animationDuration: "0.2s",
		animationTimingFunction: "ease-out",
	},
	messageSelf: {
		alignSelf: "flex-end",
		alignItems: "flex-end",
	},
	messageOther: {
		alignSelf: "flex-start",
		alignItems: "flex-start",
	},
	messageBubble: {
		padding: "10px 14px",
		fontSize: fontSize.base,
		wordBreak: "break-word",
		lineHeight: "1.45",
		position: "relative" as any,
	},
	bubbleSelf: {
		backgroundColor: colors.indigo600,
		color: colors.white,
		borderRadius: "18px 18px 4px 18px",
	},
	bubbleSelfContinue: {
		borderRadius: "18px 4px 4px 18px",
	},
	bubbleSelfLast: {
		borderRadius: "18px 4px 18px 18px",
	},
	bubbleOther: {
		backgroundColor: "rgba(30, 41, 59, 0.8)",
		color: colors.gray100,
		borderRadius: "18px 18px 18px 4px",
	},
	bubbleOtherContinue: {
		borderRadius: "4px 18px 18px 4px",
	},
	bubbleOtherLast: {
		borderRadius: "4px 18px 18px 18px",
	},
	messageTime: {
		fontSize: "0.68rem",
		color: colors.gray500,
		marginTop: "2px",
		display: "flex",
		alignItems: "center",
		gap: "3px",
	},
	readIcon: {
		color: colors.indigo400,
	},
	inputArea: {
		padding: `${spacing.md} ${spacing.lg}`,
		borderTop: `1px solid ${colors.gray800}`,
		backgroundColor: "rgba(15, 23, 42, 0.4)",
	},
	inputForm: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		backgroundColor: "rgba(30, 41, 59, 0.6)",
		borderRadius: "16px",
		padding: "6px 6px 6px 16px",
		border: `1px solid ${colors.gray700}`,
		transition: "all 0.2s ease",
		":focus-within": {
			borderColor: colors.indigo500,
			boxShadow: `0 0 0 3px ${colors.indigoAlpha10}`,
		},
	},
	textInput: {
		flex: 1,
		border: "none",
		backgroundColor: "transparent",
		color: colors.white,
		fontSize: fontSize.base,
		outline: "none",
		padding: `${spacing.sm} 0`,
		"::placeholder": {
			color: colors.gray500,
		},
	},
	sendButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "40px",
		height: "40px",
		borderRadius: "12px",
		border: "none",
		backgroundColor: colors.indigo600,
		color: colors.white,
		cursor: "pointer",
		transition: "all 0.2s ease",
		flexShrink: 0,
		":hover": {
			backgroundColor: colors.indigo500,
			transform: "scale(1.05)",
		},
		":active": {
			transform: "scale(0.95)",
		},
	},
	sendButtonDisabled: {
		backgroundColor: colors.gray700,
		cursor: "not-allowed",
		":hover": {
			backgroundColor: colors.gray700,
			transform: "none",
		},
	},
	emptyChat: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
		gap: spacing.md,
		padding: spacing.xl,
	},
	emptyChatIcon: {
		width: "64px",
		height: "64px",
		borderRadius: "20px",
		background: `linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.indigo400,
	},
	emptyChatText: {
		fontSize: fontSize.base,
		color: colors.gray400,
		textAlign: "center",
	},
	loadingContainer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	typingIndicator: {
		display: "flex",
		gap: "4px",
		padding: "12px 16px",
		backgroundColor: "rgba(30, 41, 59, 0.8)",
		borderRadius: "18px 18px 18px 4px",
		alignSelf: "flex-start",
	},
	typingDot: {
		width: "6px",
		height: "6px",
		borderRadius: "50%",
		backgroundColor: colors.gray400,
		animationName: stylex.keyframes({
			"0%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
			"50%": { opacity: 1, transform: "scale(1.1)" },
		}),
		animationDuration: "1s",
		animationIterationCount: "infinite",
	},
	typingDot2: {
		animationDelay: "0.15s",
	},
	typingDot3: {
		animationDelay: "0.3s",
	},
	messageGap: {
		marginTop: spacing.sm,
	},
});

function formatMessageTime(dateStr: string | Date) {
	const date = new Date(dateStr);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatView() {
	const { username } = Route.useParams();
	const queryClient = useQueryClient();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [content, setContent] = useState("");

	const { data: otherUser } = useQuery({
		queryKey: ["users", username],
		queryFn: () => getUser({ data: username }),
	});

	const { data: currentUser } = useQuery({
		queryKey: ["currentUser"],
		queryFn: () => getCurrentUser(),
	});

	const { data: conversations } = useQuery({
		queryKey: ["conversations"],
	});

	const conversation = (conversations as any[])?.find(
		(c) => c.otherUser?.username === username,
	);

	const { data: messages } = useQuery({
		queryKey: ["messages", conversation?.id],
		queryFn: () =>
			getMessages({ data: { conversationId: conversation!.id } }),
		enabled: !!conversation?.id,
		refetchInterval: 3000,
	});

	const markAsReadMutation = useMutation({
		mutationFn: markAsRead,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
	});

	useEffect(() => {
		if (conversation?.id && conversation.unreadCount > 0) {
			markAsReadMutation.mutate({ data: conversation.id });
		}
	}, [conversation?.id, conversation?.unreadCount]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, [username]);

	const sendMutation = useMutation({
		mutationFn: sendMessage,
		onSuccess: () => {
			setContent("");
			queryClient.invalidateQueries({
				queryKey: ["messages", conversation?.id],
			});
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			inputRef.current?.focus();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;
		sendMutation.mutate({
			data: { receiverUsername: username, content: content.trim() },
		});
	};

	if (!otherUser) {
		return (
			<div {...stylex.props(styles.loadingContainer)}>
				<div {...stylex.props(styles.typingIndicator)}>
					<div {...stylex.props(styles.typingDot)} />
					<div {...stylex.props(styles.typingDot, styles.typingDot2)} />
					<div {...stylex.props(styles.typingDot, styles.typingDot3)} />
				</div>
			</div>
		);
	}

	return (
		<div {...stylex.props(styles.container)}>
			{/* Chat header */}
			<div {...stylex.props(styles.header)}>
				<Link to="/messages" {...stylex.props(styles.backButton)}>
					<ArrowLeft size={20} />
				</Link>
				<Link
					to="/users/$username"
					params={{ username }}
					{...stylex.props(styles.headerInfo)}
				>
					<UserAvatar
						avatarUrl={otherUser.avatarUrl || undefined}
						username={otherUser.username}
						size="md"
					/>
					<div {...stylex.props(styles.headerText)}>
						<div {...stylex.props(styles.displayName)}>
							{otherUser.displayName}
						</div>
						<div {...stylex.props(styles.username)}>@{username}</div>
					</div>
				</Link>
			</div>

			{/* Messages area */}
			<div {...stylex.props(styles.messagesArea)}>
				{!conversation && !messages?.length && (
					<div {...stylex.props(styles.emptyChat)}>
						<div {...stylex.props(styles.emptyChatIcon)}>
							<Send size={28} />
						</div>
						<p {...stylex.props(styles.emptyChatText)}>
							Send a message to start chatting with{" "}
							<strong>{otherUser.displayName}</strong>
						</p>
					</div>
				)}
				{messages?.map((msg: any, index: number) => {
					const isSelf = msg.senderId === currentUser?.id;
					const prevMsg = messages[index - 1];
					const nextMsg = messages[index + 1];
					const prevSameSender = prevMsg?.senderId === msg.senderId;
					const nextSameSender = nextMsg?.senderId === msg.senderId;
					const showTime = !nextSameSender;
					const isGroupStart = !prevSameSender;

					return (
						<div
							key={msg.id}
							{...stylex.props(
								styles.messageWrapper,
								isSelf ? styles.messageSelf : styles.messageOther,
								isGroupStart && styles.messageGap,
							)}
						>
							<div
								{...stylex.props(
									styles.messageBubble,
									isSelf ? styles.bubbleSelf : styles.bubbleOther,
								)}
							>
								{msg.content}
							</div>
							{showTime && (
								<div {...stylex.props(styles.messageTime)}>
									{formatMessageTime(msg.createdAt)}
									{isSelf && (
										<CheckCheck
											size={12}
											{...stylex.props(styles.readIcon)}
										/>
									)}
								</div>
							)}
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			{/* Input area */}
			<div {...stylex.props(styles.inputArea)}>
				<form
					onSubmit={handleSubmit}
					{...stylex.props(styles.inputForm)}
				>
					<input
						ref={inputRef}
						{...stylex.props(styles.textInput)}
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Type a message..."
						disabled={sendMutation.isPending}
					/>
					<button
						type="submit"
						disabled={!content.trim() || sendMutation.isPending}
						{...stylex.props(
							styles.sendButton,
							(!content.trim() || sendMutation.isPending) &&
								styles.sendButtonDisabled,
						)}
					>
						<Send size={18} />
					</button>
				</form>
			</div>
		</div>
	);
}
