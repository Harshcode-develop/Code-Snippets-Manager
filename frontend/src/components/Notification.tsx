import React from "react";

interface Props {
  message: string;
  type: "success" | "error" | "";
}

export const Notification: React.FC<Props> = ({ message, type }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
        type === "error"
          ? "bg-gradient-to-r from-red-600 to-red-500"
          : "bg-gradient-to-r from-emerald-600 to-emerald-500"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${type === "error" ? "bg-red-300" : "bg-emerald-300"} animate-pulse`}
      />
      {message}
    </div>
  );
};
