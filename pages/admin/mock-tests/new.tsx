import MockTestEditorPage from "./[id]";
import { withAdmin } from "@/shared/hoc/withAdmin";

/** New mock test page — re-uses the MockTestEditor with no mockTestId */
export default MockTestEditorPage;

export const getServerSideProps = withAdmin;
