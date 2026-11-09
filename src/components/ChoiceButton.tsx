type ChoiceButtonProps = {
  choice: string;
  swatch?: { label: string; hex: string };
  disabled: boolean;
  isCorrect: boolean;
  isSelected: boolean;
  onSelect: (choice: string) => void;
};

export default function ChoiceButton({
  choice,
  swatch,
  disabled,
  isCorrect,
  isSelected,
  onSelect
}: ChoiceButtonProps) {
  const classNames = ["choice-button"];
  if (swatch) {
    classNames.push("swatch-choice");
  }
  if (disabled && isCorrect) {
    classNames.push("correct");
  }
  if (disabled && isSelected && !isCorrect) {
    classNames.push("wrong");
  }

  return (
    <button
      className={classNames.join(" ")}
      disabled={disabled}
      onClick={() => onSelect(choice)}
      type="button"
    >
      {swatch ? (
        <>
          <span>{swatch.label}</span>
          <span aria-hidden="true" className="color-swatch" style={{ backgroundColor: swatch.hex }} />
        </>
      ) : choice}
    </button>
  );
}
