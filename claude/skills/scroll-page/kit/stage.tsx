export interface StageProps {
  className?: string;
  children: React.ReactNode;
}

export function Stage(props: StageProps): React.JSX.Element {
  const className = props.className === undefined ? "sc-stage" : `sc-stage ${props.className}`;
  return (
    <div className={className} data-sc-stage="">
      {props.children}
    </div>
  );
}
