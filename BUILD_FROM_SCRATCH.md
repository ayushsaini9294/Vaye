# Building Vaye From Scratch: A Developer's Guide

This document explains the architecture, the technical flow, and the skills you need if you wanted to build a professional platform like **Vaye** from the ground up.

---

## 🏗️ Architecture: The Monorepo Approach

Vaye is built as a **Monorepo** using **Turborepo** and **pnpm workspaces**. 

### Why Monorepo?
- **Shared Code**: You define your database schema and types once and use them in both the API and the Frontend.
- **Atomic Changes**: You can update a feature in the backend and frontend in a single commit.
- **Tooling**: Easier to manage linting, testing, and building across multiple apps.

---

## 🛠️ The Tech Stack (The "Modern Pro" Choice)

| Layer | Technology | Why? |
|-------|------------|------|
| **Framework** | [TanStack Start](https://tanstack.com/start) | The next generation of React frameworks. Full-stack, type-safe, and very fast. |
| **Styling** | [StyleX](https://stylexjs.com/) | Built by Meta. It gives you the power of CSS-in-JS but compiles to atomic CSS for extreme performance. |
| **API** | [gRPC](https://grpc.io/) | Used by companies like Netflix and Google. Much faster and more structured than standard REST/JSON. |
| **Database** | [Drizzle ORM](https://orm.drizzle.team/) | The fastest TypeScript ORM. It feels like writing SQL but with full type safety. |
| **Storage** | [SQLite](https://sqlite.org/) | Lightweight, file-based, but extremely powerful for 90% of use cases. |

---

## 🚀 Step-by-Step Build Flow

If you were starting today with a blank folder, here is the order you would follow:

### Phase 1: The Core (Packages)
1.  **Define the Schema**: Create a `db-schema` package. Use Drizzle to define your users, posts, and likes.
2.  **Define the API (Protos)**: Create a `proto` package. Write `.proto` files that define your services (e.g., `PostService.CreatePost`).
3.  **Generate gRPC Client**: Create a `grpc-client` package that turns those `.proto` files into TypeScript functions you can call.

### Phase 2: The Backend (API)
1.  Initialize the `apps/api` using [ElysiaJS](https://elysiajs.com/) (a super-fast Bun/Node framework).
2.  Implement **Handlers**: Write the logic that actually saves posts to the database when a gRPC call comes in.
3.  Set up **JWT Authentication**: Create a way to sign tokens so the API knows who is "logged in."

### Phase 3: The Frontend (Client)
1.  Initialize `apps/client-user` using TanStack Start.
2.  **Server Functions**: Create "Server Functions" that act as the bridge between your React UI and your gRPC Backend.
3.  **Layout & UI**: Build the `Header`, `Feed`, and `Sidebar` using StyleX.
4.  **State Management**: Use `TanStack Query` to fetch and cache data (like your post feed).

---

## 🔄 The Data Flow (How it works)

When a user clicks "Post" in the UI:
1.  **React UI**: Captures the text and calls a `Server Function`.
2.  **Server Function**: Runs on the server side of the frontend app. It creates a short-lived **JWT token** and calls the **gRPC API**.
3.  **gRPC API**: Receives the call, validates the token, and uses **Drizzle** to insert the post into **SQLite**.
4.  **Database**: Saves the data and returns the new post ID.
5.  **Return Path**: The success message travels back through gRPC to the Server Function, and finally updates the React UI.

---

## 🧠 Skills You Need to Master

To build and maintain a project like this, you should focus on:

1.  **TypeScript (Advanced)**: Knowing how to use interfaces, types, and generics is critical for a monorepo.
2.  **React 19**: Understanding Hooks (`useState`, `useEffect`) and Server Components/Functions.
3.  **SQL & Database Design**: Knowing how to structure "one-to-many" (User has many Posts) and "many-to-many" (Users follow many Users) relationships.
4.  **Asynchronous Programming**: Mastering `async/await` and handling API errors gracefully.
5.  **Modern CSS**: Understanding layout concepts like Flexbox, Grid, and atomic CSS (StyleX/Tailwind).

---

## 🏁 How to Learn from this Codebase
1.  **Look at `packages/db-schema`**: See how the tables are connected.
2.  **Look at `apps/api/src/grpc/handlers`**: See how the business logic is written.
3.  **Look at `apps/client-user/src/routes/index.tsx`**: See how the frontend fetches the feed.
4.  **Look at `apps/client-user/src/components/posts/PostCard.tsx`**: See how a single post is styled.
