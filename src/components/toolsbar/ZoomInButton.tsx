import IconButton from "./IconButton";
import { AiOutlineZoomIn } from "react-icons/ai";

export default function ZoomInButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <IconButton onClick={onClick} disabled={disabled} title="Zoom in">
      <AiOutlineZoomIn className="h-4 w-4" />
    </IconButton>
  );
}
