/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";

describe("Card", () => {
  it("renders a basic card", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent("Content");
  });

  it("applies border and background classes", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("border");
    expect(card.className).toContain("rounded-lg");
  });

  it("merges custom className", () => {
    render(<Card className="custom-card" data-testid="card">Content</Card>);
    expect(screen.getByTestId("card").className).toContain("custom-card");
  });
});

describe("CardHeader", () => {
  it("renders header content", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const header = screen.getByTestId("header");
    expect(header).toHaveTextContent("Header");
    expect(header.className).toContain("p-5");
  });
});

describe("CardTitle", () => {
  it("renders as h3 with serif font", () => {
    render(<CardTitle>My Title</CardTitle>);
    const title = screen.getByText("My Title");
    expect(title.tagName).toBe("H3");
    expect(title.className).toContain("font-serif");
  });
});

describe("CardDescription", () => {
  it("renders as paragraph with secondary text color", () => {
    render(<CardDescription>Description text</CardDescription>);
    const desc = screen.getByText("Description text");
    expect(desc.tagName).toBe("P");
    expect(desc.className).toContain("text-sm");
  });
});

describe("CardContent", () => {
  it("renders content area", () => {
    render(<CardContent data-testid="content">Content area</CardContent>);
    const content = screen.getByTestId("content");
    expect(content).toHaveTextContent("Content area");
  });
});

describe("CardFooter", () => {
  it("renders footer with flex layout", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId("footer");
    expect(footer.className).toContain("flex");
  });
});

describe("Card composition", () => {
  it("renders full card with all sub-components", () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test description</CardDescription>
        </CardHeader>
        <CardContent>Card body content</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId("full-card")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Card body content")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();
  });
});
