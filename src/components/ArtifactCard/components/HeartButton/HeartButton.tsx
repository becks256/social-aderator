export const HeartButton = ({
  hearts,
  onClick,
}: {
  hearts: number
  onClick: React.MouseEventHandler<HTMLButtonElement>
}) => {
  const hasHearts = hearts > 0
  return (
    <button
      onClick={onClick}
      className={`text-xs flex items-center gap-1 ${hasHearts ? "text-red-400" : "text-gray-300 hover:text-gray-500"} transition-colors`}
    >
      {hasHearts ? "♥" : "♡"} {hearts}
    </button>
  )
}
