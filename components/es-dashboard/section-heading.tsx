type SectionHeadingProps = {
  kicker: string
  title: string
}

export function SectionHeading({ kicker, title }: SectionHeadingProps) {
  return (
    <div>
      <p className="text-sm font-medium text-[#686868]">{kicker}</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#111111] text-pretty">
        {title}
      </h2>
    </div>
  )
}
