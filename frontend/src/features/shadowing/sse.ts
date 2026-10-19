export interface SseEvent {
  event: string;
  data: unknown;
}

/**
 * Tách các sự kiện Server-Sent Events hoàn chỉnh (kết thúc bằng một dòng trống) khỏi chuỗi đã nhận. Phần chưa đủ một
 * sự kiện được trả lại ở `rest` để nối với đoạn nhận tiếp theo.
 */
export function parseSseEvents(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  let rest = buffer;
  for (let end = rest.indexOf("\n\n"); end >= 0; end = rest.indexOf("\n\n")) {
    const block = rest.slice(0, end);
    rest = rest.slice(end + 2);
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (data.length === 0) continue;
    try {
      events.push({ event, data: JSON.parse(data.join("\n")) });
    } catch {
      // một sự kiện hỏng không được làm mất cả luồng
    }
  }
  return { events, rest };
}
