export const CommentButton = ({
  comments,
  onClick,
}: {
  comments: { author: string; text: string }[]
  onClick: React.MouseEventHandler<HTMLButtonElement>
}) => (
  <button
    onClick={onClick} //}
    className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
  >
    💬 {comments.length}
  </button>
)
