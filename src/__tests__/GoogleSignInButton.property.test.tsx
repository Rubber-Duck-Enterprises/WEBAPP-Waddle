// @vitest-environment jsdom
/**
 * Feature: code-cleanup-refactor, Property 7: GoogleSignInButton renderiza el label proporcionado
 * Validates: Requirements 7.2
 */
import { describe, it } from "vitest";
import { expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as fc from "fast-check";
import GoogleSignInButton from "@/components/UI/GoogleSignInButton";

describe("GoogleSignInButton — Property 7: renderiza el label proporcionado", () => {
  it("muestra el texto del label y la imagen del logo de Google para cualquier label no vacío", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (label) => {
          const container = document.createElement("div");
          document.body.appendChild(container);
          try {
            const { getByAltText, container: renderContainer } = render(
              <GoogleSignInButton onClick={() => {}} label={label} />,
              { container }
            );
            // Check label text is present in the rendered output
            expect(renderContainer.textContent).toContain(label.trim());
            expect(getByAltText("Google Logo")).toBeInTheDocument();
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
