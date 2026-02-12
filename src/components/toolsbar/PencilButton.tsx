import IconButton from "./IconButton";
import { PiPencilSimpleLine } from "react-icons/pi";

export default function PencilButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <IconButton isActive={isActive} onClick={onClick} title="Pen (P)">
      <PiPencilSimpleLine className="h-4 w-4" />
    </IconButton>
  );
}
