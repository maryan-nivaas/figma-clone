import IconButton from "./IconButton";
import { AiOutlineRedo } from "react-icons/ai";

export default function RedoButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      title="Redo (Cmd/Ctrl+Shift+Z)"
    >
      <AiOutlineRedo className="h-4 w-4" />
    </IconButton>
  );
}
