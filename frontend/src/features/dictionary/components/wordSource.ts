import { createContext, useContext } from "react";

/**
 * Câu trong bài học mà các chữ bên trong đang thuộc về. Từ được lưu khi tra trong một câu thì ghi nhớ câu đó
 * (nguồn "bài học"); tra ở ô từ điển thì không có câu nào (nguồn "từ điển").
 */
export const WordSourceContext = createContext<string | undefined>(undefined);

export const useWordSourceSentence = () => useContext(WordSourceContext);
