import { useTranslations } from 'next-intl';

const stagesBars = [
  {
    sClass: 's1', day: '01',
    bars: [
      { key: 'FOC', cls: 'crim', w: '14%', val: '14' },
      { key: 'DIS', cls: 'crim', w: '22%', val: '22' },
      { key: 'HAB', cls: 'crim', w: '8%',  val: '08' },
      { key: 'XP',  cls: 'crim', w: '4%',  val: '120' },
    ],
    rankKey: 's1Rank', titleKey: 's1Title', noteKey: 's1Note',
  },
  {
    sClass: 's2', day: '14',
    bars: [
      { key: 'FOC', cls: 'rose', w: '38%', val: '38' },
      { key: 'DIS', cls: 'rose', w: '46%', val: '46' },
      { key: 'HAB', cls: 'rose', w: '52%', val: '52' },
      { key: 'XP',  cls: 'rose', w: '28%', val: '1.4k' },
    ],
    rankKey: 's2Rank', titleKey: 's2Title', noteKey: 's2Note',
  },
  {
    sClass: 's3', day: '45',
    bars: [
      { key: 'FOC', cls: 'viol', w: '64%', val: '64' },
      { key: 'DIS', cls: 'viol', w: '72%', val: '72' },
      { key: 'HAB', cls: 'viol', w: '78%', val: '78' },
      { key: 'XP',  cls: 'viol', w: '56%', val: '5.8k' },
    ],
    rankKey: 's3Rank', titleKey: 's3Title', noteKey: 's3Note',
  },
  {
    sClass: 's4', day: '90',
    bars: [
      { key: 'FOC', cls: 'gold', w: '92%', val: '92' },
      { key: 'DIS', cls: 'gold', w: '96%', val: '96' },
      { key: 'HAB', cls: 'gold', w: '94%', val: '94' },
      { key: 'XP',  cls: 'gold', w: '88%', val: '18k' },
    ],
    rankKey: 's4Rank', titleKey: 's4Title', noteKey: 's4Note',
  },
] as const;

export function AscentSection() {
  const t = useTranslations('landing.ascent');

  return (
    <section className="lp-scene lp-ascent" id="ascent">
      <div className="lp-chapter reveal">{t('chapter')}</div>
      <h2 className="lp-title reveal">{t('headline')}</h2>
      <p className="lp-lead reveal">
        {t.rich('lead', { em: (chunks) => <em>{chunks}</em> })}
      </p>

      <div className="lp-ascent-grid">
        {stagesBars.map((s, i) => (
          <div key={s.day} className={`lp-stage ${s.sClass} reveal${i > 0 ? ` delay-${i}` : ''}`}>
            <div className="day-node">
              <span className="d">{t('day')}</span>
              <span className="n">{s.day}</span>
            </div>
            <div className="rank-tag">{t(s.rankKey)}</div>
            <h4>{t(s.titleKey)}</h4>
            <div className="mini-bars">
              {s.bars.map((b) => (
                <div key={b.key} className="mini-bar">
                  <span className="key">{b.key}</span>
                  <span className="track">
                    <div className={b.cls} style={{ width: b.w }} />
                  </span>
                  <span className="val">{b.val}</span>
                </div>
              ))}
            </div>
            <p className="note">{t(s.noteKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
