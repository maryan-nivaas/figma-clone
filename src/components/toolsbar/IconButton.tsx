export default function IconButton({
  onClick,
  children,
  isActive,
  disabled,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-[#b7b7b7] transition-colors hover:enabled:bg-[#33373e] hover:enabled:text-white focus:enabled:bg-[#33373e] focus:enabled:text-white active:enabled:bg-[#3f4550] disabled:cursor-default disabled:opacity-40 ${isActive ? "bg-[#0b99ff] text-white hover:enabled:bg-[#0b99ff] focus:enabled:bg-[#0b99ff] active:enabled:bg-[#0b99ff]" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
