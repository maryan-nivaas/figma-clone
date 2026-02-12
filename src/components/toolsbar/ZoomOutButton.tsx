import { AiOutlineZoomOut } from "react-icons/ai";
import IconButton from "./IconButton";

export default function ZoomOutButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <IconButton onClick={onClick} disabled={disabled} title="Zoom out">
      <AiOutlineZoomOut className="h-4 w-4" />
    </IconButton>
  );
}
