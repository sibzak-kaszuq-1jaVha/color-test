type ChoiceButtonProps = {
  choice: string;
  disabled: boolean;
  isCorrect: boolean;
  isSelected: boolean;
  onSelect: (choice: string) => void;
};

export default function ChoiceButton({
  choice,
  disabled,
  isCorrect,
  isSelected,
  onSelect
}: ChoiceButtonProps) {
  const classNames = ["choice-button"];
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
      {choice}
    </button>
  );
}
