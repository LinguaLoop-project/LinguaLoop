import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import DeckDetailView from "../components/manage/DeckDetailView";
import { MY_DECKS_PATH } from "../deckManagePaths";

/**
 * Nội dung một bộ trong "Bộ của tôi" (UC-HT-09): nhóm thẻ, thẻ, nhập từ tệp Excel/CSV. Dùng cùng trang với bộ của giáo
 * viên nhưng vai trò `learner`: không có xuất bản và ảnh, và có nút "Học bộ này".
 */
export default function MyDeckDetailPage() {
  const { t } = useTranslation("vocab");
  const { deckId = "" } = useParams();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <DeckDetailView key={deckId} role="learner" deckId={deckId} back={{ path: MY_DECKS_PATH, label: t("mine.detail.back") }} />
    </main>
  );
}
