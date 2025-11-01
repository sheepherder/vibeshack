/**
 * Wiederverwendbare Button-Komponente
 *
 * @param {string} variant - Button-Stil: 'primary', 'secondary', 'icon'
 * @param {string} size - Button-Größe: 'small', 'medium', 'large'
 * @param {ReactNode} children - Button-Inhalt
 * @param {object} ...props - Weitere HTML-Button-Props
 */
export function Button({
  variant = 'primary',
  size = 'medium',
  children,
  className = '',
  ...props
}) {
  const variantClass = `btn-${variant}`
  const sizeClass = size !== 'medium' ? `btn-${size}` : ''
  const classes = ['btn', variantClass, sizeClass, className].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
