import { useCallback, useState } from "react";

const STORAGE_KEY = "ll-sidebar-collapsed";

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Trạng thái thu gọn thanh bên (chỉ áp dụng từ 1024px), lưu theo trình duyệt. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(read);
  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // không lưu được thì chỉ có hiệu lực trong phiên này
      }
      return next;
    });
  }, []);
  return [collapsed, toggle] as const;
}
