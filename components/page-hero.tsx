export function PageHero({
  eyebrow,
  title,
  titleEm,
  lead,
  bannerImage,
  children,
}: {
  eyebrow: string
  title: string
  titleEm?: string
  lead?: string
  bannerImage?: string
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden pb-12 pt-32 md:pb-16 md:pt-40">
      {bannerImage && (
        <div className="absolute inset-0 -z-10 overflow-hidden opacity-25 pointer-events-none">
          <img
            src={bannerImage}
            alt=""
            className="h-full w-full object-cover object-center blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-balance font-serif text-4xl leading-[1.08] tracking-tight text-foreground md:text-6xl">
          {title}
          {titleEm && (
            <>
              {' '}
              <em className="italic text-accent">{titleEm}</em>
            </>
          )}
        </h1>
        {lead && (
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
