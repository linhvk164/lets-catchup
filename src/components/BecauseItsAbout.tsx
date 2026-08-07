/**
 * Simple emotional beat — full-bleed panel, content aligned to page column.
 */
export function BecauseItsAbout() {
  return (
    <section
      aria-labelledby="because-heading"
      className="because-panel relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2"
    >
      <div className="because-panel__box">
        <div className="because-panel__content">
          <div className="because-panel__aside">
            <p className="because-panel__line">
              For the loved ones you miss but live far from home.
            </p>
            <div className="because-panel__rule" aria-hidden />
            <p className="because-panel__line">
              For the group calls you want to make,
              <br />
              but spend more time planning
              <br />
              than actually catching-up.
            </p>
          </div>

          <div className="because-panel__headline">
            <p className="because-panel__eyebrow">Guess what?</p>
            <h2 id="because-heading" className="because-panel__heading">
              Staying in touch shouldn&apos;t be this hard.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
