interface WordIconProps {
  icon: string;
  word: string;
  className?: string;
  imageClassName?: string;
}

export default function WordIcon({ icon, word, className = "", imageClassName = "" }: WordIconProps) {
  if (icon.startsWith("/")) {
    return <img src={icon} alt={word} className={`object-contain ${className} ${imageClassName}`} />;
  }

  return (
    <span className={className} role="img" aria-label={word}>
      {icon}
    </span>
  );
}