import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "../components/ui/skeleton";
import { Fade } from "../components/ui/fade";

describe("Skeleton", () => {
  it("renders with skeleton class", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("skeleton");
  });
});

describe("Fade", () => {
  it("shows children when show is true", () => {
    const { getByText } = render(<Fade show={true}>Visible</Fade>);
    expect(getByText("Visible")).toBeVisible();
  });
  it("hides children when show is false", () => {
    const { container, getByText } = render(<Fade show={false}>Hidden</Fade>);
    // The Fade component renders a div wrapping the children
    expect(container.firstChild).toHaveClass("opacity-0");
    expect(getByText("Hidden")).toBeVisible(); // Still in DOM, just visually hidden
  });
});
