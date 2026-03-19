export const FlagButton = ({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>
}) => (
  <button
    onClick={onClick}
    className="text-[10px] px-2.5 py-1 rounded-full border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
  >
    Flag
  </button>
)
