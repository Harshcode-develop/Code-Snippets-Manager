import React, { useState } from 'react';
import { FolderIcon, TrashIcon, PencilIcon, StarIcon } from './Icons';

export const Folder = React.memo(({ folder, onFolderSelect, onFolderDelete, onFolderRename, onToggleStar }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(folder.name);

    const handleRenameStart = (e) => {
        e.stopPropagation();
        setIsRenaming(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            onFolderRename(folder.id, newName);
            setIsRenaming(false);
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setNewName(folder.name);
            setIsRenaming(false);
        }
    };

    return (
        <div 
            className="group relative p-6 bg-bg-lighter/40 border border-primary/10 rounded-xl cursor-pointer hover:border-primary/40 shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 animate-scale-in flex flex-col items-center justify-center gap-4 gpu-accelerated"
            onClick={() => !isRenaming && onFolderSelect(folder)}
        >
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (onToggleStar) {
                            onToggleStar(folder.id);
                        }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${folder.is_starred ? 'text-warning hover:bg-warning/10' : 'text-text-muted hover:text-warning hover:bg-warning/10'}`}
                    title={folder.is_starred ? "Unstar" : "Star"}
                >
                    <StarIcon className="w-4 h-4" filled={folder.is_starred} />
                </button>
                {!isRenaming && (
                    <button 
                        onClick={handleRenameStart}
                        className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="Rename Folder"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onFolderDelete(folder.id); }}
                    className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Delete Folder"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-col items-center gap-3 w-full overflow-hidden">
                <FolderIcon className="w-16 h-16 text-yellow-500/80 drop-shadow-lg" />
                {isRenaming ? (
                    <input 
                        type="text" 
                        className="bg-bg/50 border border-primary rounded px-2 py-1 text-sm text-text focus:outline-none w-full text-center"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onBlur={() => { setIsRenaming(false); setNewName(folder.name); }} // Optional: cancel on blur
                    />
                ) : (
                    <h2 className="text-lg font-semibold text-text truncate w-full text-center">{folder.name}</h2>
                )}
            </div>
        </div>
    );
});
