import type { Legend } from "@/data/legends";
import { rarityLabel } from "@/data/legends";
import styles from "./LegendCard.module.css";

function monogram(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function LegendCard({ legend }: { legend: Legend }) {
  const { number, name, title, rarity, impact, portrait, signatureProjects, skills, era, nationality } = legend;

  return (
    <article className={styles.card} data-rarity={rarity}>
      <div className={styles.sheen} aria-hidden />

      <header className={styles.top}>
        <span className={styles.number}>{String(number).padStart(2, "0")}</span>
        <span className={styles.crest}>
          <img src="/crest.svg" alt="" width={20} height={20} />
          <span>Open Source Legends</span>
        </span>
      </header>

      <div className={styles.portrait}>
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portrait} alt={name} />
        ) : (
          <span className={styles.monogram}>{monogram(name)}</span>
        )}
        <span className={styles.rarityTag}>{rarityLabel[rarity]}</span>
      </div>

      <div className={styles.identity}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.title}>{title}</p>
      </div>

      <ul className={styles.projects}>
        {signatureProjects.slice(0, 3).map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <div className={styles.skills}>
        {skills.map((s) => (
          <div key={s.label} className={styles.skillRow}>
            <span className={styles.skillLabel}>{s.label}</span>
            <span className={styles.bar}>
              <span className={styles.barFill} style={{ width: `${s.value}%` }} />
            </span>
            <span className={styles.skillValue}>{s.value}</span>
          </div>
        ))}
      </div>

      <footer className={styles.bottom}>
        <div className={styles.impact}>
          <span className={styles.impactScore}>{impact}</span>
          <span className={styles.impactLabel}>Impact</span>
        </div>
        <div className={styles.meta}>
          <span>{era}</span>
          <span>{nationality}</span>
        </div>
        <span className={styles.codeMark}>{"</>"}</span>
      </footer>
    </article>
  );
}
