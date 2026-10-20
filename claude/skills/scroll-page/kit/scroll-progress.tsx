export function ScrollProgress(props: { className?: string }): React.JSX.Element {
  const classes = props.className === undefined ? "sc-progress" : `sc-progress ${props.className}`;
  return <div className={classes} aria-hidden="true" />;
}
