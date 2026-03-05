interface EmptyStateProps {
  text: string;
}

export function EmptyState({ text }: EmptyStateProps) {
  return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{text}</p>;
}
