import { PiFrameCornersBold } from "react-icons/pi";
import IconButton from "./IconButton";

export default function FrameButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <IconButton isActive={isActive} onClick={onClick} title="Frame (F)">
      <PiFrameCornersBold className="h-4 w-4" />
    </IconButton>
  );
}
