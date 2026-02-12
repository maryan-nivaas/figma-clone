"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasMode } from "~/types";
import IconButton from "./IconButton";
import { BiPointer } from "react-icons/bi";
import { RiHand } from "react-icons/ri";

export default function SelectionButton({
  isActive,
  canvasMode,
  onClick,
}: {
  isActive: boolean;
  canvasMode: CanvasMode;
  onClick: (canvasMode: CanvasMode.None | CanvasMode.Dragging) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = (canvasMode: CanvasMode.None | CanvasMode.Dragging) => {
    onClick(canvasMode);
    setIsOpen(false);
  };

  return (
    <div className="relative flex" ref={menuRef}>
      <IconButton
        isActive={isActive}
        onClick={() => onClick(CanvasMode.None)}
        title="Move (V)"
      >
        {canvasMode !== CanvasMode.None &&
          canvasMode !== CanvasMode.Dragging && (
            <BiPointer className="h-4 w-4" />
          )}
        {canvasMode === CanvasMode.None && <BiPointer className="h-4 w-4" />}
        {canvasMode === CanvasMode.Dragging && <RiHand className="h-4 w-4" />}
      </IconButton>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-0.5 flex h-8 w-4 rotate-180 items-center justify-center text-[#b7b7b7] hover:text-white"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M3.646 6.354l-3-3 .708-.708L4 5.293l2.646-2.647.708.708-3 3L4 6.707l-.354-.353z"
            fill="currentColor"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute -top-24 mt-1 min-w-[150px] rounded-xl border border-[#3b3b3b] bg-[#1f1f1f] p-2 shadow-lg">
          <button
            className={`flex w-full items-center rounded-md p-1 text-white hover:bg-[#0b99ff] ${canvasMode === CanvasMode.None ? "bg-[#0b99ff]" : ""}`}
            onClick={() => handleClick(CanvasMode.None)}
          >
            <span className="w-5 text-xs">
              {canvasMode === CanvasMode.None && "✓"}
            </span>
            <BiPointer className="mr-2 h-4 w-4" />
            <span className="text-xs">Move</span>
          </button>
          <button
            className={`flex w-full items-center rounded-md p-1 text-white hover:bg-[#0b99ff] ${canvasMode === CanvasMode.Dragging ? "bg-[#0b99ff]" : ""}`}
            onClick={() => handleClick(CanvasMode.Dragging)}
          >
            <span className="w-5 text-xs">
              {canvasMode === CanvasMode.Dragging && "✓"}
            </span>
            <RiHand className="mr-2 h-4 w-4" />
            <span className="text-xs">Hand tool</span>
          </button>
        </div>
      )}
    </div>
  );
}
