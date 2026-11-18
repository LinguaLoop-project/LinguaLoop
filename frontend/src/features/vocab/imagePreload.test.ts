import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preloadImage, resetPreloadedImages } from "./components/learn/imagePreload";

const created: { src: string }[] = [];

class FakeImage {
  src = "";
  decoding = "";
  constructor() {
    created.push(this);
  }
}

describe("preloadImage", () => {
  beforeEach(() => {
    created.length = 0;
    resetPreloadedImages();
    vi.stubGlobal("Image", FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts loading an image once, however often it is asked for", () => {
    preloadImage("https://cdn.example.com/a.png");
    preloadImage("https://cdn.example.com/a.png");
    preloadImage("https://cdn.example.com/b.png");

    expect(created.map((image) => image.src)).toEqual(["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"]);
  });

  it("ignores cards without an image", () => {
    preloadImage(null);
    preloadImage(undefined);
    preloadImage("");

    expect(created).toHaveLength(0);
  });

  it("does nothing where there is no Image (server, tests)", () => {
    vi.unstubAllGlobals();
    expect(() => preloadImage("https://cdn.example.com/a.png")).not.toThrow();
  });
});
