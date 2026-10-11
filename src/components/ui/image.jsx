import * as React from "react"

const FALLBACK_IMAGE_URL = "/images/placeholder.svg"

/**
 * Plain lazy-loaded image. `fittingType="fill"` crops to the box (object-cover),
 * `"fit"` letterboxes (object-contain). A broken source swaps to a neutral
 * placeholder instead of showing the browser's broken-image icon.
 */
const Image = React.forwardRef(({ src, fittingType = "fill", className, style, onError, ...props }, ref) => {
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])

  return (
    <img
      ref={ref}
      src={!src || failed ? FALLBACK_IMAGE_URL : src}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ objectFit: fittingType === "fit" ? "contain" : "cover", ...style }}
      onError={(event) => {
        if (!failed) setFailed(true)
        onError?.(event)
      }}
      {...props}
    />
  )
})
Image.displayName = "Image"

export { Image }
