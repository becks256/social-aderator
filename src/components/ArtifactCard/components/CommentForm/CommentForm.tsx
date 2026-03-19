import { useState } from "react"

export const CommentForm = ({
  onClick,
}: {
  onClick: ({
    commentAuthor,
    commentText,
  }: {
    commentAuthor: string
    commentText: string
  }) => void
}) => {
  const [commentText, setCommentText] = useState("")
  const [commentAuthor, setCommentAuthor] = useState("Anonymous")

  const handleSubmit = () => {
    if (commentText.trim()) {
      onClick?.({ commentAuthor, commentText })
      setCommentText("")
    }
  }
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <input
        className="text-xs border border-gray-200 rounded px-2 py-1 outline-none"
        placeholder="Your name"
        value={commentAuthor}
        onChange={(e) => setCommentAuthor(e.target.value)}
      />
      <div className="flex gap-1">
        <input
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none"
          placeholder="Add a comment…"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="text-xs px-2 py-1 bg-gray-900 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  )
}
