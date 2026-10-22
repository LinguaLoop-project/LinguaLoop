import { describe, expect, it } from "vitest";
import { parseSseEvents } from "./sse";

describe("parseSseEvents", () => {
  it("tách từng sự kiện và đọc JSON trong data", () => {
    const { events, rest } = parseSseEvents(
      'event: delta\ndata: {"text":"Bạn đọc "}\n\nevent: delta\ndata: {"text":"khá tốt."}\n\n',
    );
    expect(events).toEqual([
      { event: "delta", data: { text: "Bạn đọc " } },
      { event: "delta", data: { text: "khá tốt." } },
    ]);
    expect(rest).toBe("");
  });

  it("sự kiện chưa đủ thì giữ lại ở rest để nối với đoạn sau", () => {
    const first = parseSseEvents('event: delta\ndata: {"text":"a"}\n\nevent: delta\ndata: {"te');
    expect(first.events).toHaveLength(1);
    const second = parseSseEvents(first.rest + 'xt":"b"}\n\n');
    expect(second.events).toEqual([{ event: "delta", data: { text: "b" } }]);
    expect(second.rest).toBe("");
  });

  it("giữ nguyên khoảng trắng đầu và cuối của đoạn chữ", () => {
    const { events } = parseSseEvents('event: delta\ndata: {"text":" xin chào "}\n\n');
    expect(events[0].data).toEqual({ text: " xin chào " });
  });

  it("sự kiện có data hỏng bị bỏ qua, các sự kiện khác vẫn đọc được", () => {
    const { events } = parseSseEvents('event: delta\ndata: {hỏng\n\nevent: done\ndata: {"cached":false}\n\n');
    expect(events).toEqual([{ event: "done", data: { cached: false } }]);
  });

  it("chuỗi rỗng hoặc chỉ có phần dở thì không có sự kiện", () => {
    expect(parseSseEvents("")).toEqual({ events: [], rest: "" });
    expect(parseSseEvents("event: delta\ndata: {")).toEqual({ events: [], rest: "event: delta\ndata: {" });
  });
});
