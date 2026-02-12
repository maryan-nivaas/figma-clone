import IconButton from "./IconButton";
import { AiOutlineUndo } from "react-icons/ai";

export default function UndoButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <IconButton onClick={onClick} disabled={disabled} title="Undo (Cmd/Ctrl+Z)">
      <AiOutlineUndo className="h-4 w-4" />
    </IconButton>
  );
}
