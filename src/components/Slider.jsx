import styles from './Slider.module.css';

function Slider({ min = 0, max = 100, step = 10, value, onChange, label, disabled = false }) {
  return (
    <div className={`${styles.sliderWrap} ${disabled ? styles.disabled : ''}`}>
      {label && <div className={styles.label}>{label}</div>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={styles.slider}
        disabled={disabled}
      />
      <div className={styles.scale}>
        <span>{min.toLocaleString('ru-RU')}</span>
        <span>{max.toLocaleString('ru-RU')}</span>
      </div>
    </div>
  );
}

export default Slider;
