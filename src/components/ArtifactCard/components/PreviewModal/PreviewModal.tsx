export const PreviewModal = ({
  ref: dialogRef,
  src,
  alt,
}: {
  ref: React.RefObject<HTMLDialogElement | null>
  src: string
  alt: string
}) => (
  <dialog
    ref={dialogRef}
    className="m-auto backdrop:bg-black/70 bg-transparent p-0 max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden outline-none"
    onClick={(e) => {
      if (e.target === dialogRef.current) dialogRef.current.close()
    }}
  >
    <img
      src={src}
      alt={alt}
      className="block max-w-[90vw] max-h-[90vh] object-contain mx-auto"
    />
  </dialog>
)
