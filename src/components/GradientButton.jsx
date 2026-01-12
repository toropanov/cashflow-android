import styles from './GradientButton.module.css';

function GradientButton({
  children,
  onClick,
  disabled = false,
  icon = null,
  className = '',
  size = 'default',
  rolling = false,
  ariaLabel = null,
  iconClassName = '',
  style = {},
}) {
  const sizeClass = size === 'compact' ? styles.compact : '';
  const iconOnly = icon && !children;
  return (
    <button
      type="button"
      className={`${styles.gradientButton} ${disabled ? styles.disabled : ''} ${sizeClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      data-rolling={rolling ? 'true' : 'false'}
      aria-label={ariaLabel || undefined}
      style={style}
    >
      {icon && (
        <span className={`${styles.icon} ${iconOnly ? styles.iconOnly : ''} ${iconClassName}`.trim()}>{icon}</span>
      )}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

export default GradientButton;
