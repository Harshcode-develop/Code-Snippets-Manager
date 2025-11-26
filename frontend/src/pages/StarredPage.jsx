import React from 'react';
import { SnippetCard } from '../components/SnippetCard';
import { Folder } from '../components/Folder';
import { StarIcon } from '../components/Icons';

export const StarredPage = ({ folders, snippets, onFolderSelect, onFolderDelete, onFolderRename, onSnippetCopy, onSnippetDelete, onSnippetExpand, onAiChat, onToggleStar }) => {
    const starredFolders = folders.filter(f => f.is_starred);
    const starredSnippets = snippets.filter(s => s.is_starred);

    if (starredFolders.length === 0 && starredSnippets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-text-muted animate-fade-in-up">
                <div className="p-6 bg-bg-lighter/30 rounded-full mb-4">
                    <StarIcon className="w-16 h-16 text-text-muted/50" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-2">No Starred Items Yet</h2>
                <p className="text-center max-w-md">
                    Star your favorite folders and snippets to access them quickly here.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <StarIcon className="w-8 h-8 text-warning" filled /> Starred Items
            </h2>

            {starredFolders.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-text-muted mb-4 border-b border-border/50 pb-2">Folders</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {starredFolders.map(folder => (
                            <Folder 
                                key={folder.id} 
                                folder={folder} 
                                onFolderSelect={onFolderSelect} 
                                onFolderDelete={onFolderDelete} 
                                onFolderRename={onFolderRename}
                                onToggleStar={(id) => onToggleStar('folder', id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {starredSnippets.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-text-muted mb-4 border-b border-border/50 pb-2">Snippets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {starredSnippets.map(snippet => (
                            <SnippetCard 
                                key={snippet.id} 
                                snippet={snippet} 
                                onCopy={onSnippetCopy} 
                                onDelete={() => onSnippetDelete(snippet.id)} 
                                onExpand={onSnippetExpand} 
                                onAiChat={onAiChat}
                                onToggleStar={(id) => onToggleStar('snippet', id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
