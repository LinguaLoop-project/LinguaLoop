/** Bật nút thử Free/Pro. Backend cũng phải bật app.dev-tools.enabled, nếu không các API /dev trả 404. */
export const DEV_TOOLS_ENABLED = import.meta.env.VITE_DEV_TOOLS === "true";
