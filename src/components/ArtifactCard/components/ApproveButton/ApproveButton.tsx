export const ApproveButton = ({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>
}) => {
  return (
    <button
      onClick={onClick}
      className="text-[10px] px-2.5 py-1 rounded-full border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
    >
      Approve
    </button>
  )
}
