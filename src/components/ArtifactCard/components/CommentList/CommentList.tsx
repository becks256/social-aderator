import type { Comment } from "@/lib/types";

export const CommentList = ({ comments }: { comments: Comment[] }) => {
  if (comments.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {comments.map((c, i) => (
        <div key={i} className="text-[10px] bg-gray-50 rounded px-2 py-1.5">
          <span className="font-medium text-gray-600">{c.author}</span>
          <span className="text-gray-400 mx-1">·</span>
          <span className="text-gray-500">{c.text}</span>
        </div>
      ))}
    </div>
  );
};
