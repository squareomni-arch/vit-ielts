import { Avatar } from "antd";
import { IPracticeSingle } from "../../api";
import dayjs from "dayjs";

function Author({
  author: { node: author },
  postDate,
}: {
  author: IPracticeSingle["author"];
  postDate: string;
}) {
  return (
    <div className="py-4 flex items-center gap-2">
      <Avatar
        size={34}
        src={
          author.userData.avatar?.node.sourceUrl || "https://placehold.co/90x90"
        }
        alt={author.name}
      />
      <p className="text-green-500 text-base">{author.name}</p>
      <span className="w-0.5 h-0.5 rounded-full bg-gray-500"></span>
      <p>{dayjs(postDate).format("DD/MM/YYYY")}</p>
    </div>
  );
}

export default Author;
