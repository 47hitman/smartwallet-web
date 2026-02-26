import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mock next/navigation ────────────────────────────────────────────────────
const pushMock = jest.fn();
const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

// ── Mock Supabase client ────────────────────────────────────────────────────
const signInMock = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: { signInWithPassword: signInMock },
    }),
}));

// ── Mock fetch (/api/me) ────────────────────────────────────────────────────
global.fetch = jest.fn();

import LoginPage from "@/app/login/page";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("LoginPage", () => {
    it("renders email and password fields + submit button", () => {
        render(<LoginPage />);
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText("Password", { selector: "input" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^masuk$/i })).toBeInTheDocument();
    });

    it("shows loading state while submitting", async () => {
        signInMock.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 500))
        );
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ isAdmin: false }),
        });

        render(<LoginPage />);
        await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
        await userEvent.type(screen.getByLabelText("Password", { selector: "input" }), "password123");
        fireEvent.click(screen.getByRole("button", { name: /^masuk$/i }));

        expect(screen.getByRole("button", { name: /masuk/i })).toBeDisabled();
    });

    it("shows error message on failed login", async () => {
        signInMock.mockResolvedValue({
            data: null,
            error: { message: "Invalid credentials" },
        });

        render(<LoginPage />);
        await userEvent.type(screen.getByLabelText(/email/i), "wrong@example.com");
        await userEvent.type(screen.getByLabelText("Password", { selector: "input" }), "wrongpassword");
        await userEvent.click(screen.getByRole("button", { name: /^masuk$/i }));

        await waitFor(() => {
            expect(screen.getByText(/email atau password salah/i)).toBeInTheDocument();
        });
    });

    it("redirects to /dashboard for regular user on success", async () => {
        signInMock.mockResolvedValue({ data: { user: {} }, error: null });
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ isAdmin: false }),
        });

        render(<LoginPage />);
        await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
        await userEvent.type(screen.getByLabelText("Password", { selector: "input" }), "password123");
        await userEvent.click(screen.getByRole("button", { name: /^masuk$/i }));

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("redirects to /admin for admin user on success", async () => {
        signInMock.mockResolvedValue({ data: { user: {} }, error: null });
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ isAdmin: true }),
        });

        render(<LoginPage />);
        await userEvent.type(screen.getByLabelText(/email/i), "admin@smartwallet.app");
        await userEvent.type(screen.getByLabelText("Password", { selector: "input" }), "adminpassword");
        await userEvent.click(screen.getByRole("button", { name: /^masuk$/i }));

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/admin");
        });
    });

    it("toggles password visibility", async () => {
        render(<LoginPage />);
        const passwordInput = screen.getByLabelText("Password", { selector: "input" });
        expect(passwordInput).toHaveAttribute("type", "password");

        const toggleBtn = screen.getByRole("button", { name: /tampilkan password/i });
        await userEvent.click(toggleBtn);
        expect(passwordInput).toHaveAttribute("type", "text");

        const hideBtn = screen.getByRole("button", { name: /sembunyikan password/i });
        await userEvent.click(hideBtn);
        expect(passwordInput).toHaveAttribute("type", "password");
    });
});
