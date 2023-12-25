import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = ({ post, author }: PostWithUser) => {
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.profilePicture}
        alt={`Profile picture of ${author.name}`}
        className="h-16 w-16 rounded-full align-bottom"
        width={64}
        height={64}
      />
      <section className="flex flex-col gap-3 text-slate-300">
        <div className="flex flex-row gap-1.5">
          <Link href={`/@${author.name}`}>
            <span>{`@${author.name}`}</span>
          </Link>

          <p className="font-thin">
            {"· "}
            <Link href={`/post/${post.id}`}>
              {dayjs(post.createdAt).fromNow()}
            </Link>
          </p>
        </div>
        <p>{post.content}</p>
      </section>
    </div>
  );
};

export default PostView;
