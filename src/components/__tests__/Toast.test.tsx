import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "@/components/Toast";

function ToastTester() {
  const { toasts, addToast, removeToast } = useToast();
  return (
    <div>
      <button onClick={() => addToast("Info toast")}>Add Info</button>
      <button onClick={() => addToast("Success!", "success")}>Add Success</button>
      <button onClick={() => addToast("Error!", "error")}>Add Error</button>
      {toasts.length > 0 && (
        <button onClick={() => removeToast(toasts[0].id)}>Remove First</button>
      )}
      <span data-testid="count">{toasts.length}</span>
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children", () => {
    render(
      <ToastProvider>
        <div data-testid="child">Hello</div>
      </ToastProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("adds a toast via addToast", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Add Info"));
    expect(screen.getByText("Info toast")).toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("shows toast with role=alert", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Add Info"));
    expect(screen.getByRole("alert")).toHaveTextContent("Info toast");
  });

  it("auto-dismisses after 4 seconds", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Add Info"));
    expect(screen.getByText("Info toast")).toBeInTheDocument();

    // Advance past the 4-second timeout
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Info toast")).not.toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("removes a toast manually via removeToast", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Add Info"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await user.click(screen.getByText("Remove First"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("supports multiple simultaneous toasts", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Add Info"));
    await user.click(screen.getByText("Add Success"));
    await user.click(screen.getByText("Add Error"));

    expect(screen.getByTestId("count")).toHaveTextContent("3");
    expect(screen.getByText("Info toast")).toBeInTheDocument();
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });
});
