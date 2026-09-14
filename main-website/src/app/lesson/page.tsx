import { redirect } from "next/navigation";

/** The studio moved out to its own app; keep old bookmarks landing somewhere sane. */
export default function LessonRedirect() {
  redirect("/learn");
}
