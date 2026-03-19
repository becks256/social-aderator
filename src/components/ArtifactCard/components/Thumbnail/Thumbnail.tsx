const RATIO_CLASS: Record<string, string> = {
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-video",
}

export const Thumbnail = ({
  src,
  alt,
  ratio,
  onClick,
}: {
  src: string
  alt: string
  ratio: "1:1" | "9:16" | "16:9"
  onClick: React.MouseEventHandler<HTMLDivElement>
}) => (
  <div
    className={`w-full ${RATIO_CLASS[ratio]} bg-gray-50 overflow-hidden cursor-zoom-in`}
    onClick={onClick}
  >
    <img src={src} alt={alt} className="w-full h-full object-cover" />
  </div>
)
