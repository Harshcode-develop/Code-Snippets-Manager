import React from "react";
import { Folder } from "../components/Folder";
import { PlusIcon, FolderIcon } from "../components/Icons";
import type { UserData, Folder as FolderType } from "../types";

interface Props {
  userData: UserData;
  onFolderSelect: (folder: FolderType) => void;
  onFolderAdd: (parentId: string | null) => void;
  onFolderDelete: (id: string) => void;
  onFolderRename: (id: string, newName: string) => void;
  onToggleStar: (id: string) => void;
}

export const ProjectsPage: React.FC<Props> = ({
  userData,
  onFolderSelect,
  onFolderAdd,
  onFolderDelete,
  onFolderRename,
  onToggleStar,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-5 h-5 text-text-muted" />
          <h1 className="text-[18px] font-bold text-text-muted">Projects</h1>
        </div>
        <button
          onClick={() => onFolderAdd(null)}
          className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-primary to-secondary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95"
        >
          <PlusIcon className="w-3.5 h-3.5" /> New Project
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {userData.folders && userData.folders.length > 0 ? (
          userData.folders.map((folder) => (
            <Folder
              key={folder.id}
              folder={folder}
              onFolderSelect={onFolderSelect}
              onFolderDelete={onFolderDelete}
              onFolderRename={onFolderRename}
              onToggleStar={onToggleStar}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-[50vh] text-center text-text-muted">
            <p className="text-lg font-bold">No projects yet.</p>
            <p className="text-sm mt-1">Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};
