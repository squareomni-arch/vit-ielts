import CollectionEditorPage from "./[id]";
import { withAdmin } from "@/shared/hoc/withAdmin";

/** New collection page — re-uses the CollectionEditor with no collectionId */
export default CollectionEditorPage;

export const getServerSideProps = withAdmin;
