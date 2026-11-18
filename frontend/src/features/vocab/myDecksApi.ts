import { axiosClient } from "@/api/axiosClient";
import { toDeckApiError } from "./deckManageApi";
import type { MyDeck } from "./myDecks";
import type { ApiResponse } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
const BASE = "/vocab/my-decks";

async function wrap<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toDeckApiError(error);
  }
}

/** "Bộ của tôi" (`/api/v1/vocab/my-decks`); lỗi ném ra luôn là `DeckApiError`. */
export const myDecksApi = {
  list: (): Promise<MyDeck[]> =>
    wrap(async () => (await axiosClient.get<ApiResponse<MyDeck[]>>(BASE, { timeout: REQUEST_TIMEOUT_MS })).data.data),

  create: (name: string): Promise<MyDeck> =>
    wrap(async () => (await axiosClient.post<ApiResponse<MyDeck>>(BASE, { name }, { timeout: REQUEST_TIMEOUT_MS })).data.data),

  rename: (id: string, name: string): Promise<MyDeck> =>
    wrap(
      async () =>
        (await axiosClient.put<ApiResponse<MyDeck>>(`${BASE}/${encodeURIComponent(id)}`, { name }, { timeout: REQUEST_TIMEOUT_MS })).data
          .data,
    ),

  remove: (id: string): Promise<void> =>
    wrap(async () => {
      await axiosClient.delete(`${BASE}/${encodeURIComponent(id)}`, { timeout: REQUEST_TIMEOUT_MS });
    }),
};
