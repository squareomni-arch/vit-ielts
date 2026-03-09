import QuizEditorPage from "./[id]";
import { withAdmin } from "@/shared/hoc/withAdmin";

/** New quiz page — re-uses the QuizEditor with no quizId */
export default QuizEditorPage;

export const getServerSideProps = withAdmin;
