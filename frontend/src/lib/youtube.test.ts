import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "./youtube";

describe("parseYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?list=x&v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("reads the id from %s", (link, id) => {
    expect(parseYouTubeId(link)).toBe(id);
  });

  it.each(["", "hello", "https://vimeo.com/123", "https://www.youtube.com/watch?v=short", "https://www.youtube.com/@channel"])(
    "rejects %s",
    (link) => {
      expect(parseYouTubeId(link)).toBeNull();
    },
  );
});
